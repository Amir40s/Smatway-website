import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ApiLocale, translateApiText } from '../../../common/i18n';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly sendingEnabled: boolean;
  private readonly smtpConfigured: boolean;

  constructor() {
    const smtpUser = process.env.SMTP_USER ?? '';
    const smtpPass = process.env.SMTP_PASS ?? '';

    this.smtpConfigured = smtpUser.length > 0 && smtpPass.length > 0;
    this.sendingEnabled = /^(true|1)$/i.test(process.env.OTP_SEND_EMAIL ?? '');
    this.from = process.env.MAIL_FROM?.trim() || 'SmatWay <noreply@smatway.com>';

    if (!this.sendingEnabled) {
      this.logger.warn(
        'OTP_SEND_EMAIL is not true — OTP emails will NOT be sent. The code is logged to the console instead. Set OTP_SEND_EMAIL=true in apps/api/.env to enable.',
      );
    } else if (!this.smtpConfigured) {
      this.logger.warn(
        'SMTP_USER or SMTP_PASS is not set — OTP emails cannot be sent even though OTP_SEND_EMAIL is true.',
      );
    }

    const smtpHost = process.env.SMTP_HOST ?? 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT ?? '587');
    const isSecure = smtpPort === 465;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendPasswordReset(email: string, resetUrl: string, locale: ApiLocale = 'en'): Promise<void> {
    if (!this.sendingEnabled || !this.smtpConfigured) {
      this.logger.warn(`Password reset email to ${email} skipped — SMTP not configured or sending disabled.`);
      return;
    }
    const t = (text: string) => translateApiText(text, locale);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: t('Reset your SmatWay password'),
        html: `
          <p>${t('You requested a password reset for your SmatWay account.')}</p>
          <p>${t('Click the link below to set a new password. This link expires in 1 hour.')}</p>
          <p><a href="${resetUrl}">${t('Reset Password')}</a></p>
          <p>${t('If you did not request this, ignore this email — your password will not change.')}</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error);
    }
  }

  async sendVerificationOtp(email: string, code: string, name?: string | null, locale: ApiLocale = 'en'): Promise<void> {
    if (!this.sendingEnabled) {
      this.logger.log(`OTP email for ${email} skipped (OTP_SEND_EMAIL=false). Code: ${code}`);
      return;
    }
    if (!this.smtpConfigured) {
      this.logger.warn(`Skipping OTP email to ${email} — SMTP_USER/SMTP_PASS not configured.`);
      return;
    }

    const t = (text: string) => translateApiText(text, locale);
    const greeting = name ? `${t('Hi')} ${name.split(' ')[0]},` : t('Welcome to SmatWay,');

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `${code} ${t('is your SmatWay verification code')}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
            <div style="background:linear-gradient(135deg,#10b981,#0d9488);height:4px;border-radius:4px;margin-bottom:32px;"></div>
            <h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;letter-spacing:-0.01em;">${greeting}</h1>
            <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px 0;">
              ${t('Use the code below to verify your email and finish setting up your account.')}
            </p>
            <div style="text-align:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;">
              <div style="font-family:'SF Mono',Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:0.4em;color:#065f46;">${code}</div>
              <div style="font-size:12px;color:#64748b;margin-top:8px;text-transform:uppercase;letter-spacing:0.1em;">${t('Expires in 10 minutes')}</div>
            </div>
            <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0 0;">
              ${t('If you did not sign up for SmatWay, ignore this email — no account will be created without this code.')}
            </p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
              ${t('SmatWay — travel the way it should be.')}
            </div>
          </div>
        `,
      });
      this.logger.log(`Sent OTP email to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  async sendJourneyFeedbackEmail(userEmail: string, data: any): Promise<void> {
    if (!this.smtpConfigured) {
      this.logger.warn(`Skipping Journey Feedback email from ${userEmail} — SMTP not configured.`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: 'tellus@smatway.com',
        subject: `New Journey Feedback from ${userEmail}`,
        html: `
          <h2>Rate the Journey Feedback</h2>
          <p><strong>Submitted by:</strong> ${userEmail}</p>
          <hr/>
          <p><strong>1) How punctual was the vehicle/train?</strong><br/>${data.punctuality || 'N/A'}</p>
          <p><strong>2) How clean was the inside and outside?</strong><br/>${data.cleanliness || 'N/A'}</p>
          <p><strong>3) How friendly was the driver?</strong><br/>${data.driverFriendliness || 'N/A'}</p>
          <p><strong>4) How safe did you feel?</strong><br/>${data.safety || 'N/A'}</p>
          <p><strong>5) Was there any harassment on the way?</strong><br/>${data.harassment || 'N/A'}</p>
          <p><strong>6) Interrupted by law enforcement agencies?</strong><br/>${data.lawEnforcementInterruption || 'N/A'}</p>
          <p><strong>7) Anything unusual to share?</strong><br/>${data.unusualEvents || 'N/A'}</p>
          <p><strong>8) How good was the service?</strong><br/>${data.serviceQuality || 'N/A'}</p>
          <p><strong>9) Did you notice the driver collecting cash?</strong><br/>${data.driverCollectedCash || 'N/A'}</p>
          <p><strong>10) Seat comfort and overload details:</strong><br/>${data.seatComfortAndOverload || 'N/A'}</p>
        `,
      });
      this.logger.log(`Journey Feedback email sent from ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send journey feedback email from ${userEmail}`, error);
      throw error;
    }
  }
}
