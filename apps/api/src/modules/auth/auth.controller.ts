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
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Res({ passthrough: false }) res: Response) {
    const result = await this.authService.verifyEmail(dto, res);
    res.json(result);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 * 15 } })
  @Post('resend-otp')
  @HttpCode(200)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendVerificationOtp(dto.email);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const accessToken = await this.authService.issueTokens(req.user as User, res);
    res.json({ user: this.authService.safeUser(req.user as User), accessToken });
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async session(@CurrentUser() user: User) {
    const userWithUrl = await this.authService.safeUserWithPresignedUrl(user);
    return { user: userWithUrl };
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
  async me(@CurrentUser() user: User) {
    return this.authService.safeUserWithPresignedUrl(user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 * 15 } })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const origin = req.headers.origin || req.headers.referer;
    await this.authService.forgotPassword(dto.email, typeof origin === 'string' ? origin : undefined);
    return { message: 'If that email exists, a reset link was sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: false }) res: Response) {
    await this.authService.resetPassword(dto, res);
    res.json({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password')
  @HttpCode(200)
  async verifyPassword(@CurrentUser() user: User, @Body() dto: { password: string }) {
    await this.authService.verifyPassword(user.id, dto.password);
    return { ok: true };
  }
}
