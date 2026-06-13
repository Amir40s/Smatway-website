import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import { ApiLocale, translateApiText } from '../../../common/i18n';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly gmailTransporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly sendingEnabled: boolean;
  private readonly smtpConfigured: boolean;

  constructor() {
    const smtpUser = process.env.SMTP_USER ?? '';
    const smtpPass = process.env.SMTP_PASS ?? '';

    this.smtpConfigured = smtpUser.length > 0 && smtpPass.length > 0;
    this.sendingEnabled = /^(true|1)$/i.test(process.env.OTP_SEND_EMAIL ?? '');
    this.from =
      process.env.MAIL_FROM?.trim() || 'SmatWay <noreply@smatway.com>';

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

    // Fallback transporter for corporate/business email domains where
    // noreply@smatway.com may be restricted or blocked.
    this.gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'smatway02@gmail.com',
        pass: 'qpuw lbqn zqqy heri',
      },
    });
  }

  private getTransporterAndFrom(toEmail: string): {
    transporter: nodemailer.Transporter;
    from: string;
  } {
    // Consumer email domains (gmail, outlook, hotmail) → use official noreply@smatway.com.
    // Corporate/business email domains → use Gmail SMTP fallback, as some business
    // mail servers restrict or reject emails from noreply@smatway.com.
    const isConsumerDomain = /@(gmail\.com|outlook\.com|hotmail\.com)$/i.test(
      toEmail.trim(),
    );
    if (!isConsumerDomain) {
      return {
        transporter: this.gmailTransporter,
        from: 'SmatWay <smatway02@gmail.com>',
      };
    }
    return {
      transporter: this.transporter,
      from: this.from,
    };
  }

  async sendPasswordReset(
    email: string,
    resetUrl: string,
    locale: ApiLocale = 'en',
  ): Promise<void> {
    if (!this.sendingEnabled) {
      this.logger.warn(
        `Password reset email to ${email} skipped — sending disabled.`,
      );
      return;
    }

    const { transporter, from } = this.getTransporterAndFrom(email);

    if (transporter === this.transporter && !this.smtpConfigured) {
      this.logger.warn(
        `Password reset email to ${email} skipped — SMTP not configured.`,
      );
      return;
    }

    const t = (text: string) => translateApiText(text, locale);
    try {
      await transporter.sendMail({
        from: from,
        to: email,
        subject: t('Reset your SmatWay password'),
        html: `
          <p>${t('You requested a password reset for your SmatWay account.')}</p>
          <p>${t('Click the link below to set a new password. This link expires in 1 hour.')}</p>
          <p><a href="${resetUrl}">${t('Reset Password')}</a></p>
          <p>${t('If you did not request this, ignore this email — your password will not change.')}</p>
        `,
        text: `
          ${t('You requested a password reset for your SmatWay account.')}
          
          ${t('Click the link below to set a new password. This link expires in 1 hour.')}
          ${resetUrl}
          
          ${t('If you did not request this, ignore this email — your password will not change.')}
        `
          .trim()
          .replace(/^[ \t]+/gm, ''),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error);
    }
  }

  async sendVerificationOtp(
    email: string,
    code: string,
    name?: string | null,
    locale: ApiLocale = 'en',
  ): Promise<void> {
    if (!this.sendingEnabled) {
      this.logger.log(
        `OTP email for ${email} skipped (OTP_SEND_EMAIL=false). Code: ${code}`,
      );
      return;
    }

    const { transporter, from } = this.getTransporterAndFrom(email);

    if (transporter === this.transporter && !this.smtpConfigured) {
      this.logger.warn(
        `Skipping OTP email to ${email} — SMTP_USER/SMTP_PASS not configured.`,
      );
      return;
    }

    const t = (text: string) => translateApiText(text, locale);
    const greeting = name
      ? `${t('Hi')} ${name.split(' ')[0]},`
      : t('Welcome to SmatWay,');

    try {
      await transporter.sendMail({
        from: from,
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
        text: `
          ${greeting}
          
          ${t('Use the code below to verify your email and finish setting up your account.')}
          
          ${code}
          ${t('Expires in 10 minutes')}
          
          ${t('If you did not sign up for SmatWay, ignore this email — no account will be created without this code.')}
          
          ${t('SmatWay — travel the way it should be.')}
        `
          .trim()
          .replace(/^[ \t]+/gm, ''),
      });
      this.logger.log(`Sent OTP email to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  async sendJourneyFeedbackEmail(userEmail: string, data: any): Promise<void> {
    const targetEmail = 'tellus@smatway.com';
    const { transporter, from } = this.getTransporterAndFrom(targetEmail);

    if (transporter === this.transporter && !this.smtpConfigured) {
      this.logger.warn(
        `Skipping Journey Feedback email from ${userEmail} — SMTP not configured.`,
      );
      return;
    }

    try {
      await transporter.sendMail({
        from: from,
        to: targetEmail,
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
        text: `
          Rate the Journey Feedback
          Submitted by: ${userEmail}
          ---------------------------
          1) How punctual was the vehicle/train?
          ${data.punctuality || 'N/A'}
          2) How clean was the inside and outside?
          ${data.cleanliness || 'N/A'}
          3) How friendly was the driver?
          ${data.driverFriendliness || 'N/A'}
          4) How safe did you feel?
          ${data.safety || 'N/A'}
          5) Was there any harassment on the way?
          ${data.harassment || 'N/A'}
          6) Interrupted by law enforcement agencies?
          ${data.lawEnforcementInterruption || 'N/A'}
          7) Anything unusual to share?
          ${data.unusualEvents || 'N/A'}
          8) How good was the service?
          ${data.serviceQuality || 'N/A'}
          9) Did you notice the driver collecting cash?
          ${data.driverCollectedCash || 'N/A'}
          10) Seat comfort and overload details:
          ${data.seatComfortAndOverload || 'N/A'}
        `
          .trim()
          .replace(/^[ \t]+/gm, ''),
      });
      this.logger.log(`Journey Feedback email sent from ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send journey feedback email from ${userEmail}`,
        error,
      );
      throw error;
    }
  }

  async sendBookingTicketEmail(
    userEmail: string,
    bookingDetails: any,
    locale: ApiLocale = 'en',
  ): Promise<void> {
    const { transporter, from } = this.getTransporterAndFrom(userEmail);
    const t = (text: string) => translateApiText(text, locale);

    if (!this.smtpConfigured) {
      this.logger.warn(
        `Skipping ticket email to ${userEmail} — SMTP not configured.`,
      );
      return;
    }

    let qrBuffer: Buffer | undefined;
    try {
      qrBuffer = await QRCode.toBuffer(bookingDetails.bookingNumber, {
        margin: 2,
        width: 220,
      });
    } catch (qrErr) {
      this.logger.error(
        `Failed to generate QR code for booking ${bookingDetails.bookingNumber}`,
        qrErr,
      );
    }

    const qrData = encodeURIComponent(bookingDetails.bookingNumber);
    const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${qrData}`;
    const qrSrc = qrBuffer ? 'cid:qrcode' : qrFallbackUrl;

    try {
      await transporter.sendMail({
        from: from,
        to: userEmail,
        subject: `${t('Your SmatWay Booking Ticket')} — ${bookingDetails.bookingNumber}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
            <!-- Header bar -->
            <div style="background:linear-gradient(135deg,#10b981,#0d9488);height:6px;border-radius:4px;margin-bottom:28px;"></div>
            <h1 style="font-size:22px;font-weight:700;margin:0 0 4px 0;letter-spacing:-0.01em;">${t('Your SmatWay Ticket')}</h1>
            <p style="font-size:14px;color:#64748b;margin:0 0 28px 0;">${t('Show this ticket to the driver before boarding.')}</p>

            <!-- QR scan section -->
            <div style="background:#f0fdf4;border:2px solid #6ee7b7;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#065f46;margin:0 0 16px 0;">📱 ${t('Driver Scan Code')}</p>
              <img
                src="${qrSrc}"
                alt="${t('Scan code for driver')}"
                width="220"
                height="220"
                style="display:block;margin:0 auto 16px auto;border:4px solid #ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.12);"
              />
              <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:0.15em;color:#065f46;background:#ffffff;display:inline-block;padding:8px 20px;border-radius:8px;border:1px solid #bbf7d0;">
                ${bookingDetails.bookingNumber}
              </div>
              <p style="font-size:12px;color:#6b7280;margin:12px 0 0 0;">${t('The driver scans this QR code to confirm your seat.')}</p>
            </div>

            <!-- Booking details -->
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;font-weight:500;width:40%;">${t('Route')}</td>
                <td style="padding:10px 4px;font-weight:600;">${bookingDetails.route}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;font-weight:500;">${t('Date & Time')}</td>
                <td style="padding:10px 4px;font-weight:600;">${bookingDetails.dateTime}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;font-weight:500;">${t('Seats')}</td>
                <td style="padding:10px 4px;font-weight:600;">${bookingDetails.seats}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;font-weight:500;">${t('Total Price')}</td>
                <td style="padding:10px 4px;font-weight:700;color:#10b981;">${bookingDetails.price}</td>
              </tr>
              <tr>
                <td style="padding:10px 4px;color:#64748b;font-weight:500;">${t('Transporter')}</td>
                <td style="padding:10px 4px;font-weight:600;">${bookingDetails.transporterName}</td>
              </tr>
            </table>

            <!-- Footer -->
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
              ${t('SmatWay — travel the way it should be.')}
            </div>
          </div>
        `,
        text: `
          ${t('Your SmatWay Ticket')}
          ${t('Booking Number')}: ${bookingDetails.bookingNumber}
          ${t('Route')}: ${bookingDetails.route}
          ${t('Date & Time')}: ${bookingDetails.dateTime}
          ${t('Seats')}: ${bookingDetails.seats}
          ${t('Total Price')}: ${bookingDetails.price}
          ${t('Transporter')}: ${bookingDetails.transporterName}
          ${t('Driver Scan Code (QR)')}: ${qrFallbackUrl}
          ${t('Thank you for booking with SmatWay!')}
        `
          .trim()
          .replace(/^[ \t]+/gm, ''),
        attachments: qrBuffer
          ? [
              {
                filename: 'qrcode.png',
                content: qrBuffer,
                cid: 'qrcode',
              },
            ]
          : [],
      });
      this.logger.log(`Ticket email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send ticket email to ${userEmail}`, error);
      throw error;
    }
  }

  async sendSiteFeedbackEmail(
    userEmail: string,
    rating: number,
    comment: string,
  ): Promise<void> {
    const targetEmail = 'tellus@smatway.com';
    const { transporter, from } = this.getTransporterAndFrom(targetEmail);

    if (transporter === this.transporter && !this.smtpConfigured) {
      this.logger.warn(
        `Skipping Site Feedback email from ${userEmail} — SMTP not configured.`,
      );
      return;
    }

    try {
      await transporter.sendMail({
        from: from,
        to: targetEmail,
        subject: `New Site Feedback from ${userEmail}`,
        html: `
          <h2>Site Feedback Received</h2>
          <p><strong>Submitted by:</strong> ${userEmail}</p>
          <p><strong>Rating:</strong> ${rating} / 5</p>
          <p><strong>Comment:</strong></p>
          <blockquote style="background:#f9f9f9;padding:10px;border-left:5px solid #ccc;">
            ${comment}
          </blockquote>
        `,
        text: `
          Site Feedback Received
          Submitted by: ${userEmail}
          Rating: ${rating} / 5
          Comment:
          ${comment}
        `
          .trim()
          .replace(/^[ \t]+/gm, ''),
      });
      this.logger.log(`Site Feedback email sent from ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send site feedback email from ${userEmail}`,
        error,
      );
      throw error;
    }
  }
}
