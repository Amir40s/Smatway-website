import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly paystackApiUrl = 'https://api.paystack.co';
  private readonly flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  private readonly flutterwaveWebhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async initializePayment(bookingId: string, userId: string, callbackUrl?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { traveler: true, transport: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.travelerId !== userId) {
      throw new BadRequestException('You do not have permission to pay for this booking');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    // 1. Flutterwave payment initialization
    if (booking.paymentMethod === 'FLUTTERWAVE') {
      if (!this.flutterwaveSecretKey) {
        throw new InternalServerErrorException('Flutterwave secret key is not configured');
      }

      let paymentCurrency = booking.transport.currency || 'USD';
      let paymentAmount = Number(booking.totalPrice);

      const FLUTTERWAVE_SUPPORTED_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'RWF', 'UGX', 'USD', 'EUR', 'GBP', 'TZS', 'ZMW', 'XOF', 'XAF'];
      if (!FLUTTERWAVE_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        // Convert to USD using simple static rates if currency not supported by Flutterwave
        const exchangeRatesToUSD: Record<string, number> = {
          PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27,
          EGP: 0.021, ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044,
          XOF: 0.0017, XAF: 0.0017, MAD: 0.10, DZD: 0.0074, TND: 0.32,
        };
        const rateToUSD = exchangeRatesToUSD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      const txRef = `flw_${booking.id}_${Date.now()}`;
      const fallbackCallbackUrl = `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/traveler/booking/${booking.id}`;
      const finalCallbackUrl = callbackUrl || fallbackCallbackUrl;
      const redirectUrl = finalCallbackUrl.includes('?') 
        ? `${finalCallbackUrl}&reference=${txRef}` 
        : `${finalCallbackUrl}?reference=${txRef}`;

      const payload = {
        tx_ref: txRef,
        amount: Number(paymentAmount.toFixed(2)),
        currency: paymentCurrency,
        payment_options: 'card, mobilemoney, ussd',
        redirect_url: redirectUrl,
        meta: {
          bookingId: booking.id,
          travelerId: booking.travelerId,
        },
        customer: {
          email: booking.traveler.email,
          name: booking.traveler.name || 'Traveler',
          phone_number: booking.traveler.phoneNumber || '08000000000',
        },
        customizations: {
          title: 'SmatWay Booking Payment',
          description: `Payment for booking #${booking.id.slice(0, 8).toUpperCase()}`,
        },
      };

      try {
        this.logger.log(`Flutterwave payload: ${JSON.stringify(payload)}`);

        const response = await firstValueFrom(
          this.httpService.post('https://api.flutterwave.com/v3/payments', payload, {
            headers: {
              Authorization: `Bearer ${this.flutterwaveSecretKey}`,
              'Content-Type': 'application/json',
            },
          }),
        );

        return {
          authorization_url: response.data.data.link,
          reference: txRef,
        };
      } catch (error: any) {
        const flwError = error.response?.data;
        const status = error.response?.status;
        this.logger.error(
          `Flutterwave /v3/payments failed — HTTP ${status ?? 'N/A'}: ${JSON.stringify(flwError ?? error.message)}`
        );
        throw new InternalServerErrorException(
          flwError?.message || 'Flutterwave payment initialization failed'
        );
      }
    }

    // 2. Paystack payment initialization (fallback default)
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException('Paystack secret key is not configured');
    }

    let paymentCurrency = booking.transport.currency || 'NGN';
    let paymentAmount = Number(booking.totalPrice);

    // Standard Paystack merchant accounts only support NGN, GHS, and USD directly.
    // Other currencies will be converted to NGN to prevent "Currency not supported by merchant" errors.
    const PAYSTACK_SUPPORTED_CURRENCIES = ['NGN', 'GHS', 'USD'];
    if (!PAYSTACK_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
       const exchangeRatesToUSD: Record<string, number> = {
        PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27,
        EGP: 0.021, ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044,
        XOF: 0.0017, XAF: 0.0017, MAD: 0.10, DZD: 0.0074, TND: 0.32,
        KES: 0.0076, ZAR: 0.054, RWF: 0.00077, UGX: 0.00026, GHS: 0.071, NGN: 0.00067,
      };
      const rateToUSD = exchangeRatesToUSD[paymentCurrency] || 1;
      const amountInUSD = paymentAmount * rateToUSD;
      // Convert USD to NGN
      const rateUSDToNGN = 1 / (exchangeRatesToUSD['NGN'] || 0.00067);
      paymentAmount = amountInUSD * rateUSDToNGN;
      paymentCurrency = 'NGN';
    }

    const amountInMinorUnits = Math.round(paymentAmount * 100);

    const fallbackCallbackUrl = `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/traveler/booking/${booking.id}`;

    const payload = {
      amount: amountInMinorUnits,
      email: booking.traveler.email,
      reference: `${booking.id}_${Date.now()}`, // Using unique reference to avoid duplicate transaction errors
      currency: paymentCurrency,
      callback_url: callbackUrl || fallbackCallbackUrl,
      metadata: {
        bookingId: booking.id,
        travelerId: booking.travelerId,
      },
    };

    try {
      this.logger.log(`Paystack payload: ${JSON.stringify(payload)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.paystackApiUrl}/transaction/initialize`, payload, {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data.data;
    } catch (error: any) {
      const paystackError = error.response?.data;
      const status = error.response?.status;
      this.logger.error(
        `Paystack /transaction/initialize failed — HTTP ${status ?? 'N/A'}: ${JSON.stringify(paystackError ?? error.message)}`
      );
      throw new InternalServerErrorException(
        paystackError?.message || 'Payment initialization failed'
      );
    }
  }

  async verifyPayment(reference: string, userId: string) {
    // 1. Flutterwave payment verification
    if (reference.startsWith('flw_')) {
      if (!this.flutterwaveSecretKey) {
        throw new InternalServerErrorException('Flutterwave secret key is not configured');
      }

      try {
        const response = await firstValueFrom(
          this.httpService.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
            headers: {
              Authorization: `Bearer ${this.flutterwaveSecretKey}`,
            },
          }),
        );

        const data = response.data.data;

        if (response.data.status === 'success' && data.status === 'successful') {
          const bookingId = data.tx_ref.split('_')[1];

          const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
          if (!booking) {
            throw new NotFoundException('Booking not found');
          }

          if (booking.travelerId !== userId) {
            throw new BadRequestException('You do not have permission to verify this booking');
          }

          if (booking.paymentStatus !== PaymentStatus.PAID) {
            await this.prisma.booking.update({
              where: { id: bookingId },
              data: {
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: 'FLUTTERWAVE',
              },
            });
          }

          return { success: true, status: data.status, bookingId };
        }

        return { success: false, status: data.status };
      } catch (error: any) {
        this.logger.error('Failed to verify Flutterwave payment', error.response?.data || error.message);
        throw new InternalServerErrorException('Payment verification failed');
      }
    }

    // 2. Paystack payment verification (default)
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException('Paystack secret key is not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.paystackApiUrl}/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        }),
      );

      const data = response.data.data;

      if (data.status === 'success') {
        const bookingId = data.reference.split('_')[0];

        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
          throw new NotFoundException('Booking not found');
        }

        if (booking.travelerId !== userId) {
            throw new BadRequestException('You do not have permission to verify this booking');
        }

        if (booking.paymentStatus !== PaymentStatus.PAID) {
            await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: 'PAYSTACK',
            },
            });
        }
        
        return { success: true, status: data.status, bookingId };
      }

      return { success: false, status: data.status };
    } catch (error: any) {
      this.logger.error('Failed to verify Paystack payment', error.response?.data || error.message);
      throw new InternalServerErrorException('Payment verification failed');
    }
  }

  async handleWebhook(signature: string, payload: any) {
    if (!this.paystackSecretKey) return;

    // Verify event signature
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      this.logger.warn('Invalid Paystack webhook signature');
      return;
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const bookingId = data.reference.split('_')[0];
      
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: 'PAYSTACK',
          },
        });
        this.logger.log(`Booking ${bookingId} marked as PAID via webhook`);
      }
    }
  }

  async handleFlutterwaveWebhook(signature: string, payload: any) {
    if (this.flutterwaveWebhookHash && signature !== this.flutterwaveWebhookHash) {
      this.logger.warn('Invalid Flutterwave webhook signature');
      return;
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed' && data.status === 'successful') {
      const txRef = data.tx_ref;
      if (txRef && txRef.startsWith('flw_')) {
        const bookingId = txRef.split('_')[1];

        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: 'FLUTTERWAVE',
            },
          });
          this.logger.log(`Booking ${bookingId} marked as PAID via Flutterwave webhook`);
        }
      }
    }
  }
}
