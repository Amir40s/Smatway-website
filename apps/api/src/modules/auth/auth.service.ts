import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountType, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { generateRawToken, hashToken } from '../../common/utils/token.util';
import { clearAuthCookies, setAuthCookies } from '../../common/utils/cookie.util';
import { MailService } from './mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_HOURS = 1;
const REFRESH_TOKEN_TTL_DAYS = 30;
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
  ) { }

  async validateLocalUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    if (!user.emailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }
    return user;
  }

  async register(dto: RegisterDto): Promise<{ email: string; pendingVerification: true }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Allow re-registering an unverified account (overwrite profile data, resend OTP)
      if (!existing.emailVerified) {
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const updated = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            name: dto.name ?? existing.name,
            phoneNumber: dto.phoneNumber ?? existing.phoneNumber,
            country: dto.country ?? existing.country,
            preferredCurrency: dto.preferredCurrency ?? existing.preferredCurrency,
            passwordHash,
            accountType: this.normalizeAccountType(dto.accountType) ?? existing.accountType,
          },
        });
        // Ensure the UserProfile row exists — older accounts may not have one.
        await this.prisma.userProfile.upsert({
          where: { userId: existing.id },
          update: { companyName: dto.businessName ?? undefined },
          create: { userId: existing.id, companyName: dto.businessName ?? undefined },
        });
        await this.issueVerificationOtp(updated);
        return { email: updated.email, pendingVerification: true };
      }
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        country: dto.country,
        preferredCurrency: dto.preferredCurrency,
        passwordHash,
        accountType: this.normalizeAccountType(dto.accountType),
        // Auto-create an empty profile so Settings pages work immediately after signup.
        profile: { create: { companyName: dto.businessName ?? undefined } },
      },
    });

    await this.issueVerificationOtp(user);
    return { email: user.email, pendingVerification: true };
  }

  async verifyEmail(dto: VerifyEmailDto, res: Response): Promise<{ user: Omit<User, 'passwordHash'>; accessToken: string }> {
    const email = dto.email?.trim().toLowerCase();
    const otp = dto.otp?.trim();
    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid verification code');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    // Dev-only bypass: when OTP_SEND_EMAIL is off, accept "123456" so UI
    // testing doesn't require reading the console on every signup.
    const sendingEnabled = /^(true|1)$/i.test(process.env.OTP_SEND_EMAIL ?? '');
    const isDevBypass = !sendingEnabled && otp === '123456';

    if (!isDevBypass) {
      const record = await this.prisma.emailVerificationOtp.findFirst({
        where: { userId: user.id, used: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) throw new BadRequestException('No active verification code — request a new one');
      if (record.expiresAt < new Date()) throw new BadRequestException('Verification code has expired');
      if (record.attempts >= OTP_MAX_ATTEMPTS) throw new BadRequestException('Too many attempts — request a new code');

      const match = await bcrypt.compare(otp, record.codeHash);
      if (!match) {
        await this.prisma.emailVerificationOtp.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        });
        throw new BadRequestException('Incorrect verification code');
      }

      await this.prisma.emailVerificationOtp.update({
        where: { id: record.id },
        data: { used: true },
      });
    }

    const [verifiedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      // Invalidate any outstanding codes for this user
      this.prisma.emailVerificationOtp.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
    ]);

    if (isDevBypass) {
      // eslint-disable-next-line no-console
      console.log(`[OTP] dev-bypass used for ${email} (OTP_SEND_EMAIL=false)`);
    }

    const accessToken = await this.issueTokens(verifiedUser, res);
    return { user: this.safeUser(verifiedUser), accessToken };
  }

  async resendVerificationOtp(email: string): Promise<{ ok: true }> {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) throw new BadRequestException('Email is required');

    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    // Don't leak whether the account exists
    if (!user || user.emailVerified) return { ok: true };

    // Cooldown — latest outstanding OTP must be older than OTP_RESEND_COOLDOWN_SECONDS
    const latest = await this.prisma.emailVerificationOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      const ageSec = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (ageSec < OTP_RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(`Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSec)}s before requesting another code`);
      }
    }

    await this.issueVerificationOtp(user);
    return { ok: true };
  }

  private async issueVerificationOtp(user: User): Promise<void> {
    // Invalidate any existing open codes
    await this.prisma.emailVerificationOtp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate 6-digit zero-padded numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.emailVerificationOtp.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    // Log the code to the server console when email sending is disabled
    // (dev mode or OTP_SEND_EMAIL != true) so the flow can still be tested.
    const sendingEnabled = /^(true|1)$/i.test(process.env.OTP_SEND_EMAIL ?? '');
    if (!sendingEnabled || process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`\n[OTP] ${user.email} → ${code} (expires in ${OTP_TTL_MINUTES}m)\n`);
    }

    // Send the email in the background so a slow SMTP connection doesn't block the API response.
    // The user can still pick the code up from the server log or request a resend.
    this.mailService.sendVerificationOtp(user.email, code, user.name).catch(() => {
      // Already logged inside MailService.
    });
  }

  async issueTokens(user: User, res: Response): Promise<string> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role } as any,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '30d' } as any,
    );

    const rawRefresh = generateRawToken(64);
    const tokenHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
    setAuthCookies(res, accessToken, rawRefresh);
    return accessToken;
  }

  async refreshTokens(rawRefreshToken: string | undefined, res: Response): Promise<void> {
    if (!rawRefreshToken) throw new UnauthorizedException('No refresh token');

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { tokenHash } });
    await this.issueTokens(stored.user, res);
  }

  async logout(userId: string, rawRefreshToken: string | undefined, res: Response): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash, userId } });
    }
    clearAuthCookies(res);
  }

  async forgotPassword(email: string, origin?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = generateRawToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await this.prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });

    let baseUrl = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    if (origin) {
      const cleanOrigin = origin.replace(/\/$/, '');
      const allowedUrls = (process.env.ALLOWED_REDIRECT_URLS ?? '').split(',');
      const isAllowed = allowedUrls.some(u => cleanOrigin.startsWith(u.trim().replace(/\/$/, ''))) ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('smatway.com');
      if (isAllowed) {
        baseUrl = cleanOrigin;
      }
    }

    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    // Send password reset email in the background so slow SMTP doesn't block the API response
    this.mailService.sendPasswordReset(email, resetUrl).catch(() => {
      // Already logged inside MailService
    });
  }

  async resetPassword(dto: ResetPasswordDto, res: Response): Promise<void> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { tokenHash }, data: { used: true } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    clearAuthCookies(res);
  }

  async verifyPassword(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
  }

  private normalizeAccountType(
    accountType?: RegisterDto['accountType'] | 'traveler' | 'transporter',
  ): AccountType | undefined {
    if (!accountType) {
      return undefined;
    }

    const normalized = accountType.toString().toUpperCase();

    if (normalized === 'TRAVELER' || normalized === 'TRANSPORTER') {
      return normalized;
    }

    return undefined;
  }

  safeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }

  async safeUserWithPresignedUrl(user: User): Promise<Omit<User, 'passwordHash'> & { avatarUrl: string | null }> {
    const { passwordHash: _ph, ...safe } = user;

    const avatarUrl = await this.storageService.resolveImageUrl(user.avatarUrl);
    return { ...safe, avatarUrl };
  }
}
