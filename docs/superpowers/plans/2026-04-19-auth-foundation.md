# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete auth foundation (Google OAuth, email/password, forgot/reset password, role-based admin access) for the smatway monorepo using NestJS Passport strategies, HttpOnly cookies, and hashed refresh tokens.

**Architecture:** NestJS API owns all auth logic via an additive `AuthModule` using `passport-local`, `passport-google-oauth20`, and `passport-jwt`. Access token (15min JWT) and refresh token (7-day random hex, SHA-256 hashed in DB, rotated) are stored in HttpOnly cookies. Both Next.js frontends are thin API clients.

**Tech Stack:** NestJS v11, Passport.js, `@nestjs/jwt`, `passport-local`, `passport-google-oauth20`, `passport-jwt`, bcrypt, Resend SDK, `@nestjs/throttler`, `cookie-parser`, Prisma v7, PostgreSQL, Redis, Next.js 16, Tailwind v4.

---

## File Map

### API — new files
```
apps/api/src/modules/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  strategies/
    local.strategy.ts
    google.strategy.ts
    jwt.strategy.ts
  guards/
    local-auth.guard.ts
    google-auth.guard.ts
    jwt-auth.guard.ts
    roles.guard.ts
  decorators/
    roles.decorator.ts
    current-user.decorator.ts
  dto/
    register.dto.ts
    forgot-password.dto.ts
    reset-password.dto.ts
  mail/
    mail.module.ts
    mail.service.ts

apps/api/src/common/utils/
  token.util.ts
  cookie.util.ts
```

### API — modified files
```
apps/api/prisma/schema.prisma          — add Role enum + 3 new models + update User
apps/api/src/app.module.ts             — import AuthModule, ThrottlerModule
apps/api/src/main.ts                   — enable cookie-parser, CORS
```

### Web — new files
```
apps/web/lib/api.ts                    — typed fetch wrapper
apps/web/lib/auth.ts                   — getCurrentUser()
apps/web/app/(auth)/reset-password/page.tsx
```

### Web — modified files
```
apps/web/app/(auth)/signin/page.tsx    — wire form + Google button
apps/web/app/(auth)/signup/page.tsx    — wire form
apps/web/app/(auth)/forgot-password/page.tsx  — wire form + success state
apps/web/app/dashboard/layout.tsx      — auth redirect guard
```

### Admin — new files
```
apps/admin/lib/api.ts
apps/admin/app/(auth)/login/page.tsx
apps/admin/app/(auth)/layout.tsx
apps/admin/app/unauthorized/page.tsx
apps/admin/app/dashboard/page.tsx
apps/admin/middleware.ts
```

### Admin — modified files
```
apps/admin/app/page.tsx                — redirect to /dashboard
apps/admin/app/layout.tsx              — add font/metadata
```

---

## Task 1: Install API Dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd apps/api && npm install @nestjs/passport passport passport-local passport-google-oauth20 passport-jwt @nestjs/jwt bcrypt resend @nestjs/throttler cookie-parser
```

- [ ] **Step 2: Install type defs**

```bash
npm install --save-dev @types/passport-local @types/passport-google-oauth20 @types/passport-jwt @types/bcrypt @types/cookie-parser
```

- [ ] **Step 3: Verify installs**

```bash
npm ls @nestjs/passport passport-local passport-google-oauth20 passport-jwt @nestjs/jwt bcrypt resend @nestjs/throttler cookie-parser 2>&1 | head -20
```
Expected: all listed without `UNMET DEPENDENCY` errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json
git commit -m "chore(api): install auth dependencies"
```

---

## Task 2: Prisma Schema + Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Replace `apps/api/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  USER
  ADMIN
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  name           String?
  passwordHash   String?
  role           Role      @default(USER)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  authProviders  AuthProvider[]
  refreshTokens  RefreshToken[]
  passwordResets PasswordResetToken[]
}

model AuthProvider {
  id         String   @id @default(uuid())
  provider   String
  providerId String
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([provider, providerId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Create migration**

```bash
cd apps/api && npm run prisma:migrate:dev -- --name add_auth_foundation
```
Expected output: `The following migration(s) have been applied: .../add_auth_foundation/migration.sql`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npm run prisma:generate
```
Expected: `Generated Prisma Client` message.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): add auth models to prisma schema"
```

---

## Task 3: Token + Cookie Utilities

**Files:**
- Create: `apps/api/src/common/utils/token.util.ts`
- Create: `apps/api/src/common/utils/cookie.util.ts`

- [ ] **Step 1: Create token util**

Create `apps/api/src/common/utils/token.util.ts`:

```typescript
import { createHash, randomBytes } from 'node:crypto';

export function generateRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
```

- [ ] **Step 2: Create cookie util**

Create `apps/api/src/common/utils/cookie.util.ts`:

```typescript
import { Response } from 'express';

const IS_PROD = process.env.NODE_ENV === 'production';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const base = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookie('access_token', accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response): void {
  const base = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' };
  res.clearCookie('access_token', base);
  res.clearCookie('refresh_token', base);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/common/utils/
git commit -m "feat(api): add token and cookie utilities"
```

---

## Task 4: Passport Strategies

**Files:**
- Create: `apps/api/src/modules/auth/strategies/local.strategy.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/strategies/google.strategy.ts`

- [ ] **Step 1: Create local strategy**

Create `apps/api/src/modules/auth/strategies/local.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateLocalUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
```

- [ ] **Step 2: Create JWT strategy**

Create `apps/api/src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token ?? null,
      ]),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

- [ ] **Step 3: Create Google strategy**

Create `apps/api/src/modules/auth/strategies/google.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3002/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName: string;
      emails: { value: string; verified: boolean }[];
    },
    done: VerifyCallback,
  ) {
    const { id, displayName, emails } = profile;
    done(null, {
      providerId: id,
      email: emails[0].value,
      name: displayName,
    });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/strategies/
git commit -m "feat(api): add passport strategies (local, jwt, google)"
```

---

## Task 5: Guards and Decorators

**Files:**
- Create: `apps/api/src/modules/auth/guards/local-auth.guard.ts`
- Create: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/modules/auth/guards/google-auth.guard.ts`
- Create: `apps/api/src/modules/auth/guards/roles.guard.ts`
- Create: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/modules/auth/decorators/current-user.decorator.ts`

- [ ] **Step 1: Create guards**

Create `apps/api/src/modules/auth/guards/local-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Create `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Create `apps/api/src/modules/auth/guards/google-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
```

- [ ] **Step 2: Create RolesGuard**

Create `apps/api/src/modules/auth/guards/roles.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest();
    return required.includes(user?.role);
  }
}
```

- [ ] **Step 3: Create decorators**

Create `apps/api/src/modules/auth/decorators/roles.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Create `apps/api/src/modules/auth/decorators/current-user.decorator.ts`:
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/guards/ apps/api/src/modules/auth/decorators/
git commit -m "feat(api): add auth guards and decorators"
```

---

## Task 6: DTOs

**Files:**
- Create: `apps/api/src/modules/auth/dto/register.dto.ts`
- Create: `apps/api/src/modules/auth/dto/forgot-password.dto.ts`
- Create: `apps/api/src/modules/auth/dto/reset-password.dto.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/api/src/modules/auth/dto/register.dto.ts`:
```typescript
export class RegisterDto {
  email: string;
  password: string;
  name?: string;
}
```

Create `apps/api/src/modules/auth/dto/forgot-password.dto.ts`:
```typescript
export class ForgotPasswordDto {
  email: string;
}
```

Create `apps/api/src/modules/auth/dto/reset-password.dto.ts`:
```typescript
export class ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/auth/dto/
git commit -m "feat(api): add auth DTOs"
```

---

## Task 7: Mail Module

**Files:**
- Create: `apps/api/src/modules/auth/mail/mail.module.ts`
- Create: `apps/api/src/modules/auth/mail/mail.service.ts`

- [ ] **Step 1: Create mail service**

Create `apps/api/src/modules/auth/mail/mail.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY ?? '');
    this.from = process.env.MAIL_FROM ?? 'noreply@smatway.com';
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Reset your SmatWay password',
        html: `
          <p>You requested a password reset for your SmatWay account.</p>
          <p>Click the link below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you did not request this, ignore this email — your password will not change.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error);
    }
  }
}
```

- [ ] **Step 2: Create mail module**

Create `apps/api/src/modules/auth/mail/mail.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/auth/mail/
git commit -m "feat(api): add mail module with resend integration"
```

---

## Task 8: AuthService

**Files:**
- Create: `apps/api/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Create AuthService**

Create `apps/api/src/modules/auth/auth.service.ts`:

```typescript
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { generateRawToken, hashToken } from '../../common/utils/token.util';
import { clearAuthCookies, setAuthCookies } from '../../common/utils/cookie.util';
import { MailService } from './mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_HOURS = 1;
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ── Local auth ─────────────────────────────────────────────────────────────

  async validateLocalUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async register(dto: RegisterDto, res: Response): Promise<{ user: Omit<User, 'passwordHash'> }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    await this.issueTokens(user, res);
    const { passwordHash: _ph, ...safeUser } = user;
    return { user: safeUser };
  }

  // ── Token issuance ──────────────────────────────────────────────────────────

  async issueTokens(user: User, res: Response): Promise<void> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
    );

    const rawRefresh = generateRawToken(64);
    const tokenHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
    setAuthCookies(res, accessToken, rawRefresh);
  }

  async refreshTokens(rawRefreshToken: string | undefined, res: Response): Promise<void> {
    if (!rawRefreshToken) throw new UnauthorizedException('No refresh token');

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Possible token reuse — invalidate all tokens for safety
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

  // ── Google OAuth ────────────────────────────────────────────────────────────

  async handleGoogleCallback(
    profile: { providerId: string; email: string; name: string },
    res: Response,
  ): Promise<void> {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email: profile.email, name: profile.name },
      });
    }

    const existing = await this.prisma.authProvider.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: profile.providerId } },
    });

    if (!existing) {
      await this.prisma.authProvider.create({
        data: { provider: 'google', providerId: profile.providerId, userId: user.id },
      });
    }

    await this.issueTokens(user, res);
  }

  // ── Forgot / Reset password ─────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent — no enumeration

    const rawToken = generateRawToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    // Invalidate existing unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await this.prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });

    const resetUrl = `${process.env.WEB_URL ?? 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordReset(email, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto, res: Response): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { tokenHash }, data: { used: true } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    clearAuthCookies(res);
  }

  safeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }
}
```

- [ ] **Step 2: Write unit test for AuthService**

Create `apps/api/src/modules/auth/auth.service.spec.ts`:

```typescript
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { hashToken } from '../../common/utils/token.util';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  authProvider: { findUnique: jest.fn(), create: jest.fn() },
  refreshToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  passwordResetToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn(),
};
const mockJwt = { sign: jest.fn().mockReturnValue('signed-jwt') } as unknown as JwtService;
const mockMail = { sendPasswordReset: jest.fn() };
const mockRes = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mockPrisma as any, mockJwt, mockMail as any);
  });

  describe('validateLocalUser', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.validateLocalUser('a@b.com', 'pw')).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', passwordHash: hash });
      expect(await service.validateLocalUser('a@b.com', 'wrong')).toBeNull();
    });

    it('returns user when credentials are valid', async () => {
      const hash = await bcrypt.hash('correct', 10);
      const user = { id: '1', email: 'a@b.com', passwordHash: hash };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      expect(await service.validateLocalUser('a@b.com', 'correct')).toEqual(user);
    });
  });

  describe('register', () => {
    it('throws ConflictException if email taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.register({ email: 'a@b.com', password: 'pw' }, mockRes)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('hashToken / generateRawToken round-trip', () => {
    it('hash is deterministic', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });
    it('different inputs produce different hashes', () => {
      expect(hashToken('abc')).not.toBe(hashToken('xyz'));
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd apps/api && npm test -- --testPathPattern=auth.service --no-coverage
```
Expected: `Tests: 5 passed`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "feat(api): implement AuthService with all auth flows"
```

---

## Task 9: AuthController

**Files:**
- Create: `apps/api/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Create controller**

Create `apps/api/src/modules/auth/auth.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: false }) res: Response) {
    const result = await this.authService.register(dto, res);
    res.json(result);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    await this.authService.issueTokens(req.user as User, res);
    res.json({ user: this.authService.safeUser(req.user as User) });
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const profile = req.user as { providerId: string; email: string; name: string };
    await this.authService.handleGoogleCallback(profile, res);
    const redirectTo = (req.query['redirectTo'] as string) || process.env.WEB_URL || 'http://localhost:3000';
    const allowed = (process.env.ALLOWED_REDIRECT_URLS ?? '').split(',').map(u => u.trim());
    const safeRedirect = allowed.includes(redirectTo) ? redirectTo : (process.env.WEB_URL ?? 'http://localhost:3000');
    res.redirect(safeRedirect);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    await this.authService.refreshTokens(req.cookies?.refresh_token, res);
    res.json({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    await this.authService.logout(user.id, req.cookies?.refresh_token, res);
    res.json({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.authService.safeUser(user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 * 15 } })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email exists, a reset link was sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: false }) res: Response) {
    await this.authService.resetPassword(dto, res);
    res.json({ ok: true });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/auth/auth.controller.ts
git commit -m "feat(api): add AuthController with all endpoints"
```

---

## Task 10: AuthModule + Wire Into AppModule

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Create AuthModule**

Create `apps/api/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { RolesGuard } from './guards/roles.guard';
import { MailModule } from './mail/mail.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
```

- [ ] **Step 2: Update AppModule**

Replace `apps/api/src/app.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './modules/cache/cache.module';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    HealthModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Add cookie-parser to main.ts**

In `apps/api/src/main.ts`, after `const app = await NestFactory.create(AppModule);` add:

```typescript
import cookieParser from 'cookie-parser';
// ...
app.use(cookieParser());
app.enableCors({
  origin: (process.env.ALLOWED_REDIRECT_URLS ?? 'http://localhost:3000').split(',').map(u => u.trim()),
  credentials: true,
});
```

The full updated `main.ts`:

```typescript
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const appEnvPath = resolve(__dirname, '..', '.env');
if (existsSync(appEnvPath)) {
  loadEnv({ path: appEnvPath });
}

const logger = new Logger('Bootstrap');
const maxPortAttempts = 20;

function resolveStartPort(defaultPort: number): number {
  const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
  if (Number.isInteger(parsedPort) && parsedPort > 0) return parsedPort;
  return defaultPort;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.ALLOWED_REDIRECT_URLS ?? 'http://localhost:3000')
      .split(',')
      .map((u) => u.trim()),
    credentials: true,
  });

  const startPort = resolveStartPort(3002);
  let selectedPort = startPort;

  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    try {
      await app.listen(selectedPort);
      if (selectedPort !== startPort) {
        logger.warn(`Port ${startPort} is busy. Falling back to port ${selectedPort}.`);
      }
      logger.log(`API listening on port ${selectedPort}`);
      return;
    } catch (error) {
      const isAddressInUse =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'EADDRINUSE';
      if (!isAddressInUse) throw error;
      selectedPort += 1;
    }
  }

  throw new Error(`No free port found in range ${startPort}-${startPort + maxPortAttempts - 1}`);
}
bootstrap();
```

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
cd apps/api && npm run build 2>&1 | tail -20
```
Expected: `Successfully compiled` (or `webpack compiled successfully`). Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/auth/ apps/api/src/app.module.ts apps/api/src/main.ts
git commit -m "feat(api): wire AuthModule into AppModule, add cookie-parser + CORS"
```

---

## Task 11: API Environment Variables

**Files:**
- Modify: `apps/api/.env`

- [ ] **Step 1: Add auth env vars**

Append to `apps/api/.env`:

```env
JWT_SECRET=change-me-to-32-plus-random-bytes
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback
ALLOWED_REDIRECT_URLS=http://localhost:3000,http://localhost:3001
RESEND_API_KEY=re_your_key_here
MAIL_FROM=noreply@smatway.com
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

- [ ] **Step 2: Update .env.example**

Create/update `apps/api/.env.example` with the same keys but empty values so Coolify deployment has the full list.

- [ ] **Step 3: Smoke test API startup**

```bash
cd apps/api && npm run dev
```
Expected: `API listening on port 3002` with no crash.

Test health still works:
```bash
curl http://localhost:3002/health
```
Expected: JSON health response.

Test auth endpoint exists:
```bash
curl -X POST http://localhost:3002/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
Expected: `{"message":"If that email exists, a reset link was sent."}`

- [ ] **Step 4: Commit**

```bash
git add apps/api/.env.example
git commit -m "chore(api): update env example with all auth vars"
```

---

## Task 12: Web — API Client + Auth Lib

**Files:**
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/auth.ts`

- [ ] **Step 1: Create fetch wrapper**

Create `apps/web/lib/api.ts`:

```typescript
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
};
```

- [ ] **Step 2: Create auth helper**

Create `apps/web/lib/auth.ts`:

```typescript
import { api, ApiError } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>('/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/api.ts apps/web/lib/auth.ts
git commit -m "feat(web): add api client and auth helpers"
```

---

## Task 13: Web — Wire Signin Page

**Files:**
- Modify: `apps/web/app/(auth)/signin/page.tsx`

- [ ] **Step 1: Replace page with wired version**

Replace `apps/web/app/(auth)/signin/page.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

const BASE_API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002";

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid email or password." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full animate-fade-in-up">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-10 transition-colors">
        <ArrowLeftIcon /><span>Back to Home</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Welcome back</h1>
        <p className="text-slate-500">Sign in to your SmatWay account</p>
      </div>

      <a
        href={`${BASE_API}/auth/google?redirectTo=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")}`}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-slate-50 transition-all mb-5"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 border-t border-slate-100" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 border-t border-slate-100" />
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-900 mb-1.5 block">Email</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none"><MailIcon /></span>
            <input
              id="email" type="email" placeholder="you@example.com" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-900 block">Password</label>
            <Link href="/forgot-password" className="text-sm text-slate-400 hover:text-emerald-600 transition-colors">Forgot password?</Link>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none"><LockIcon /></span>
            <input
              id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 pr-11 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 focus:outline-none">
              {showPassword ? "👁" : "🙈"}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit" disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl active:scale-[0.98] transition-all duration-150 text-center text-sm"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      <div className="border-t border-slate-100 my-6" />
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(auth)/signin/page.tsx
git commit -m "feat(web): wire signin page to API with Google OAuth button"
```

---

## Task 14: Web — Wire Signup Page

**Files:**
- Modify: `apps/web/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Read existing signup page**

```bash
cat apps/web/app/(auth)/signup/page.tsx
```

- [ ] **Step 2: Wire signup to API**

The existing signup page `onSubmit` does `e.preventDefault()`. Wire it to `POST /auth/register`. Add `email`, `password`, `name` state, error display, and redirect to `/dashboard` on success. Keep all existing visual structure and icons.

Replace the export default and add state:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

// ... keep existing icon components unchanged ...

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, name });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ... return the existing JSX with:
  // - form onSubmit={handleSubmit}
  // - input values wired to state
  // - error banner when error is truthy
  // - submit button shows loading state
}
```

**Important:** Read the full current file first (`cat apps/web/app/(auth)/signup/page.tsx`), then add the state + handler while keeping all existing icon SVGs and layout JSX intact.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(auth)/signup/page.tsx
git commit -m "feat(web): wire signup page to POST /auth/register"
```

---

## Task 15: Web — Wire Forgot Password + New Reset Password Page

**Files:**
- Modify: `apps/web/app/(auth)/forgot-password/page.tsx`
- Create: `apps/web/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Wire forgot-password page**

Replace `apps/web/app/(auth)/forgot-password/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full animate-fade-in-up">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
            <KeyIcon />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Check your email</h1>
          <p className="text-slate-500">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
          </p>
        </div>
        <a href="/signin" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
          <ArrowLeftIcon /><span>Back to Sign In</span>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <a href="/signin" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-10 transition-colors">
        <ArrowLeftIcon /><span>Back to Sign In</span>
      </a>

      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 animate-scale-in">
          <KeyIcon />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Reset your password</h1>
        <p className="text-slate-500">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-900 mb-1.5 block">Email Address</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none"><MailIcon /></span>
            <input
              id="email" type="email" placeholder="you@example.com" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit" disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl active:scale-[0.98] transition-all duration-150 text-center flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="border-t border-slate-100 my-6" />
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Remember your password?{" "}
          <a href="/signin" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Sign In</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create reset-password page**

Create `apps/web/app/(auth)/reset-password/page.tsx`:

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function LockIcon() {
  return (
    <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setDone(true);
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? "This reset link is invalid or has expired." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full">
        <p className="text-slate-500">Invalid reset link. <a href="/forgot-password" className="text-emerald-600">Request a new one.</a></p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Password updated!</h1>
        <p className="text-slate-500">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
          <LockIcon />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Set new password</h1>
        <p className="text-slate-500">Choose a strong password for your account.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-900 mb-1.5 block">New Password</label>
          <input
            id="password" type="password" placeholder="8+ characters" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(auth)/forgot-password/page.tsx apps/web/app/(auth)/reset-password/page.tsx
git commit -m "feat(web): wire forgot-password and add reset-password page"
```

---

## Task 16: Web — Dashboard Auth Guard

**Files:**
- Modify: `apps/web/app/dashboard/layout.tsx`

- [ ] **Step 1: Read current dashboard layout**

```bash
cat apps/web/app/dashboard/layout.tsx
```

- [ ] **Step 2: Add server-side auth check**

The dashboard layout needs to call `GET /auth/me` from the server and redirect to `/signin` if not authenticated. Since this is Next.js 16 (App Router), use an async Server Component.

Add at the top of the existing layout:

```tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002"}/auth/me`,
      {
        headers: { Cookie: `access_token=${accessToken}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
```

And at the start of the layout component function:

```tsx
const user = await getUser();
if (!user) redirect("/signin");
```

Read the full file first, make targeted additions. Do not remove existing sidebar/navigation JSX.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/layout.tsx
git commit -m "feat(web): add server-side auth guard to dashboard layout"
```

---

## Task 17: Admin — Auth Pages + Middleware

**Files:**
- Create: `apps/admin/lib/api.ts`
- Create: `apps/admin/app/(auth)/login/page.tsx`
- Create: `apps/admin/app/(auth)/layout.tsx`
- Create: `apps/admin/app/unauthorized/page.tsx`
- Create: `apps/admin/app/dashboard/page.tsx`
- Create: `apps/admin/middleware.ts`
- Modify: `apps/admin/app/page.tsx`

- [ ] **Step 1: Create admin api client**

Create `apps/admin/lib/api.ts` — identical to web version:

```typescript
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
};
```

- [ ] **Step 2: Create auth layout**

Create `apps/admin/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create login page**

Create `apps/admin/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ user: { role: string } }>("/auth/login", { email, password });
      if (res.user.role !== "ADMIN") {
        await api.post("/auth/logout", {});
        setError("Access denied. Admin accounts only.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid email or password." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">SmatWay Admin</h1>
        <p className="text-sm text-zinc-500">Sign in to the admin panel</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input
            id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-zinc-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-800 disabled:opacity-60 transition-colors text-sm"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create unauthorized page**

Create `apps/admin/app/unauthorized/page.tsx`:

```tsx
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-6">You don&apos;t have permission to access the admin panel.</p>
        <a href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 underline">Back to login</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create dashboard page**

Create `apps/admin/app/dashboard/page.tsx`:

```tsx
export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Admin Dashboard</h1>
        <p className="text-zinc-500">Welcome to the SmatWay admin panel.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create Next.js middleware for admin role guard**

Create `apps/admin/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/_next", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002";
    const res = await fetch(`${apiBase}/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const user = await res.json();
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 7: Update admin home page to redirect**

Replace `apps/admin/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
```

- [ ] **Step 8: Add tsconfig path alias for admin**

Check `apps/admin/tsconfig.json`. If it doesn't have `@/*` path alias, add:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): add login page, middleware role guard, dashboard"
```

---

## Task 18: Build Verification

- [ ] **Step 1: Build API**

```bash
cd apps/api && npm run build 2>&1 | tail -30
```
Expected: `Successfully compiled` with 0 errors.

- [ ] **Step 2: Build web**

```bash
cd apps/web && npm run build 2>&1 | tail -30
```
Expected: build completes with 0 errors. Fix any TypeScript errors before continuing.

- [ ] **Step 3: Build admin**

```bash
cd apps/admin && npm run build 2>&1 | tail -30
```
Expected: build completes with 0 errors.

- [ ] **Step 4: Run API unit tests**

```bash
cd apps/api && npm test -- --no-coverage 2>&1 | tail -20
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify all builds pass post-auth implementation"
```

---

## Task 19: Google Cloud Console Setup (Manual)

These steps are performed in the Google Cloud Console — no code changes.

- [ ] **Step 1: Create or select a Google Cloud project**

Visit [console.cloud.google.com](https://console.cloud.google.com), create or select the smatway project.

- [ ] **Step 2: Enable Google+ API / People API**

APIs & Services → Enable APIs → search "Google+ API" or "Google Identity" → Enable.

- [ ] **Step 3: Configure OAuth consent screen**

APIs & Services → OAuth consent screen → External → Fill app name "SmatWay", user support email, developer contact. Add scope: `email`, `profile`.

- [ ] **Step 4: Create OAuth 2.0 credentials**

APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Web application.

**Authorized JavaScript origins:**
- `http://localhost:3002`
- `https://api.yourdomain.com` (production)

**Authorized redirect URIs:**
- `http://localhost:3002/auth/google/callback`
- `https://api.yourdomain.com/auth/google/callback`

- [ ] **Step 5: Copy client ID + secret to `apps/api/.env`**

```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

---

## Task 20: Coolify Deployment Env Vars

This is documentation of required env vars per service for Coolify deployment — no code changes.

- [ ] **Step 1: Set API env vars in Coolify**

```
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<32+ random bytes — generate with: openssl rand -hex 32>
JWT_EXPIRES_IN=15m
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback
ALLOWED_REDIRECT_URLS=https://yourdomain.com,https://admin.yourdomain.com
RESEND_API_KEY=re_...
MAIL_FROM=noreply@yourdomain.com
WEB_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
```

- [ ] **Step 2: Set web env vars in Coolify**

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

- [ ] **Step 3: Set admin env vars in Coolify**

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

- [ ] **Step 4: Production verification checklist**

After deployment:
1. `GET https://api.yourdomain.com/health` → `{ status: "ok" }`
2. `POST https://api.yourdomain.com/auth/register` with test email/password → 201
3. `POST https://api.yourdomain.com/auth/login` → 200 + cookies set
4. `GET https://yourdomain.com/signin` → page loads, form works
5. Click "Continue with Google" → redirects to Google → returns to web dashboard
6. Forgot password flow → email arrives within 1–2 min
7. Reset password link → loads reset page, can set new password
8. Admin login at `https://admin.yourdomain.com/login` with non-admin → "Access denied"
9. Admin login with admin-role user → reaches `/dashboard`

---

## Rollback Plan

If something goes wrong post-deploy:

1. **API rollback:** Remove `AuthModule` from `AppModule.imports`, redeploy. Existing health/app endpoints unaffected.
2. **DB rollback:** `prisma migrate` is additive only. To roll back: `DROP TABLE "PasswordResetToken", "RefreshToken", "AuthProvider"; ALTER TABLE "User" DROP COLUMN "passwordHash", DROP COLUMN "role"; DROP TYPE "Role";`
3. **Web rollback:** Revert `signin/page.tsx`, `forgot-password/page.tsx`, `dashboard/layout.tsx` to stubs. The `reset-password/page.tsx` can stay — it just won't be linked.
4. **Admin rollback:** Remove `middleware.ts` — admin site reverts to open access.
