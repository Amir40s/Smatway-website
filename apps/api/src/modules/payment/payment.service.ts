import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { MailService } from '../auth/mail/mail.service';
import { ChatGateway } from '../chat/chat.gateway';

import { normalizeCountryCode } from '../../common/utils/country.util';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly paystackApiUrl = 'https://api.paystack.co';
  private readonly flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  private readonly flutterwaveWebhookHash =
    process.env.FLUTTERWAVE_WEBHOOK_HASH;

  private readonly paypalClientId = process.env.PAYPAL_CLIENT_ID;
  private readonly paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  private readonly paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

  private readonly revolutSecretKey = process.env.REVOLUT_SECRET_KEY;
  private readonly revolutEnvironment = process.env.REVOLUT_ENVIRONMENT || 'sandbox';

  // Common exchange rates used for PayPal and Revolut when native currency isn't supported
  private readonly EXCHANGE_RATES_TO_USD: Record<string, number> = {
    PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27, EGP: 0.021, 
    ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044, XOF: 0.0017, 
    XAF: 0.0017, MAD: 0.1, DZD: 0.0074, TND: 0.32, KES: 0.0076, ZAR: 0.054, RWF: 0.00077, 
    UGX: 0.00026, GHS: 0.071, NGN: 0.00067,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async initializePayment(
    bookingId: string,
    userId: string,
    callbackUrl?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { traveler: true, transport: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.travelerId !== userId) {
      throw new BadRequestException(
        'You do not have permission to pay for this booking',
      );
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    // 1. Flutterwave payment initialization
    if (booking.paymentMethod === 'FLUTTERWAVE') {
      if (!this.flutterwaveSecretKey) {
        throw new InternalServerErrorException(
          'Flutterwave secret key is not configured',
        );
      }

      let paymentCurrency = booking.transport.currency || 'USD';
      let paymentAmount = Number(booking.totalPrice);

      const FLUTTERWAVE_SUPPORTED_CURRENCIES = [
        'NGN',
        'GHS',
        'ZAR',
        'KES',
        'RWF',
        'UGX',
        'USD',
        'EUR',
        'GBP',
        'TZS',
        'ZMW',
        'XOF',
        'XAF',
      ];
      if (!FLUTTERWAVE_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        // Convert to USD using simple static rates if currency not supported by Flutterwave
        const exchangeRatesToUSD: Record<string, number> = {
          PKR: 0.0036,
          INR: 0.012,
          EUR: 1.08,
          GBP: 1.26,
          AED: 0.27,
          SAR: 0.27,
          EGP: 0.021,
          ETB: 0.017,
          ZMW: 0.038,
          MWK: 0.00057,
          MZN: 0.016,
          SLE: 0.000044,
          XOF: 0.0017,
          XAF: 0.0017,
          MAD: 0.1,
          DZD: 0.0074,
          TND: 0.32,
        };
        const rateToUSD = exchangeRatesToUSD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      const txRef = `flw_${normalizeCountryCode(booking.transport.departureCountry)}_${booking.id}_${Date.now()}`;
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
          this.httpService.post(
            'https://api.flutterwave.com/v3/payments',
            payload,
            {
              headers: {
                Authorization: `Bearer ${this.flutterwaveSecretKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        return {
          authorization_url: response.data.data.link,
          reference: txRef,
        };
      } catch (error: any) {
        const flwError = error.response?.data;
        const status = error.response?.status;
        this.logger.error(
          `Flutterwave /v3/payments failed — HTTP ${status ?? 'N/A'}: ${JSON.stringify(flwError ?? error.message)}`,
        );
        throw new InternalServerErrorException(
          flwError?.message || 'Flutterwave payment initialization failed',
        );
      }
    }

    // 2. PayPal payment initialization
    if (booking.paymentMethod === 'PAYPAL') {
      if (!this.paypalClientId || !this.paypalClientSecret) {
        throw new InternalServerErrorException('PayPal credentials are not configured');
      }

      const txRef = `ppal_${normalizeCountryCode(booking.transport.departureCountry)}_${booking.id}_${Date.now()}`;
      const fallbackCallbackUrl = `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/traveler/booking/${booking.id}`;
      const finalCallbackUrl = callbackUrl || fallbackCallbackUrl;
      const redirectUrl = finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=${txRef}` : `${finalCallbackUrl}?reference=${txRef}`;

      let paymentCurrency = booking.transport.currency || 'USD';
      let paymentAmount = Number(booking.totalPrice);
      
      // Convert to USD if not supported
      const PAYPAL_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']; // subset
      if (!PAYPAL_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        const rateToUSD = this.EXCHANGE_RATES_TO_USD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      try {
        const paypalApiUrl = this.paypalEnvironment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        const authString = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64');
        
        const tokenResponse = await firstValueFrom(
          this.httpService.post(`${paypalApiUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
              Authorization: `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        );
        const accessToken = tokenResponse.data.access_token;

        const orderPayload = {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: txRef,
            amount: { currency_code: paymentCurrency, value: paymentAmount.toFixed(2) }
          }],
          application_context: {
            return_url: redirectUrl,
            cancel_url: redirectUrl
          }
        };

        const orderResponse = await firstValueFrom(
          this.httpService.post(`${paypalApiUrl}/v2/checkout/orders`, orderPayload, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        );

        const approvalUrl = orderResponse.data.links.find((link: any) => link.rel === 'approve')?.href;
        if (!approvalUrl) throw new Error('No approval URL in PayPal response');

        return { authorization_url: approvalUrl, reference: txRef };
      } catch (error: any) {
        this.logger.error(`PayPal initialization failed: ${error.message}`);
        throw new InternalServerErrorException('PayPal payment initialization failed');
      }
    }

    // 3. Revolut payment initialization
    if (booking.paymentMethod === 'REVOLUT') {
      if (!this.revolutSecretKey) {
        throw new InternalServerErrorException('Revolut secret key is not configured');
      }

      const txRef = `rev_${normalizeCountryCode(booking.transport.departureCountry)}_${booking.id}_${Date.now()}`;
      const fallbackCallbackUrl = `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/traveler/booking/${booking.id}`;
      const finalCallbackUrl = callbackUrl || fallbackCallbackUrl;
      const redirectUrl = finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=${txRef}` : `${finalCallbackUrl}?reference=${txRef}`;

      let paymentCurrency = booking.transport.currency || 'USD';
      let paymentAmount = Number(booking.totalPrice);
      
      const REVOLUT_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY', 'NZD', 'PLN', 'SEK', 'ZAR'];
      if (!REVOLUT_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        const rateToUSD = this.EXCHANGE_RATES_TO_USD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      try {
        const revolutApiUrl = this.revolutEnvironment === 'sandbox' ? 'https://sandbox-merchant.revolut.com' : 'https://merchant.revolut.com';
        
        const orderPayload = {
          amount: Math.round(paymentAmount * 100),
          currency: paymentCurrency,
          merchant_order_ext_ref: txRef,
          customer_email: booking.traveler.email,
          description: `SmatWay Booking #${booking.id.slice(0, 8)}`,
          redirect_url: redirectUrl
        };

        const orderResponse = await firstValueFrom(
          this.httpService.post(`${revolutApiUrl}/api/1.0/orders`, orderPayload, {
            headers: {
              Authorization: `Bearer ${this.revolutSecretKey}`,
              'Content-Type': 'application/json'
            }
          })
        );

        return { authorization_url: orderResponse.data.checkout_url, reference: txRef };
      } catch (error: any) {
        this.logger.error(`Revolut initialization failed: ${error.message}`);
        throw new InternalServerErrorException('Revolut payment initialization failed');
      }
    }

    // 2. Paystack payment initialization (fallback default)
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key is not configured',
      );
    }

    let paymentCurrency = booking.transport.currency || 'NGN';
    let paymentAmount = Number(booking.totalPrice);

    // Paystack standard merchant accounts require NGN currency.
    // Convert non-NGN currencies to NGN to prevent "Currency not supported by merchant" errors.
    const PAYSTACK_SUPPORTED_CURRENCIES = ['NGN'];
    if (!PAYSTACK_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
      const exchangeRatesToUSD: Record<string, number> = {
        USD: 1.0,
        PKR: 0.0036,
        INR: 0.012,
        EUR: 1.08,
        GBP: 1.26,
        AED: 0.27,
        SAR: 0.27,
        EGP: 0.021,
        ETB: 0.017,
        ZMW: 0.038,
        MWK: 0.00057,
        MZN: 0.016,
        SLE: 0.000044,
        XOF: 0.0017,
        XAF: 0.0017,
        MAD: 0.1,
        DZD: 0.0074,
        TND: 0.32,
        KES: 0.0076,
        ZAR: 0.054,
        RWF: 0.00077,
        UGX: 0.00026,
        GHS: 0.071,
        NGN: 0.00067,
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
      reference: `${normalizeCountryCode(booking.transport.departureCountry)}_${booking.id}_${Date.now()}`, // Country-aware and unique per booking
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
        this.httpService.post(
          `${this.paystackApiUrl}/transaction/initialize`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.data;
    } catch (error: any) {
      const paystackError = error.response?.data;
      const status = error.response?.status;
      this.logger.error(
        `Paystack /transaction/initialize failed — HTTP ${status ?? 'N/A'}: ${JSON.stringify(paystackError ?? error.message)}`,
      );
      throw new InternalServerErrorException(
        paystackError?.message || 'Payment initialization failed',
      );
    }
  }

  async verifyPayment(reference: string, userId: string) {
    // 1. Flutterwave payment verification
    if (reference.startsWith('flw_')) {
      if (!this.flutterwaveSecretKey) {
        throw new InternalServerErrorException(
          'Flutterwave secret key is not configured',
        );
      }

      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
            {
              headers: {
                Authorization: `Bearer ${this.flutterwaveSecretKey}`,
              },
            },
          ),
        );

        const data = response.data.data;

        if (
          response.data.status === 'success' &&
          data.status === 'successful'
        ) {
          const bookingId = data.tx_ref.split('_')[2];

          const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
          });
          if (!booking) {
            throw new NotFoundException('Booking not found');
          }

          if (booking.travelerId !== userId) {
            throw new BadRequestException(
              'You do not have permission to verify this booking',
            );
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
        this.logger.error(
          'Failed to verify Flutterwave payment',
          error.response?.data || error.message,
        );
        throw new InternalServerErrorException('Payment verification failed');
      }
    }

    // 2. PayPal payment verification
    if (reference.startsWith('ppal_')) {
      const bookingId = reference.split('_')[2];
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.travelerId !== userId) throw new BadRequestException('Not authorized');

      // Note: PayPal REST API v2/checkout/orders/ doesn't support searching by reference easily without the order ID.
      // Rely on the webhook to mark it as PAID. We just return the current status.
      return { 
        success: booking.paymentStatus === PaymentStatus.PAID, 
        status: booking.paymentStatus, 
        bookingId 
      };
    }

    // 3. Revolut payment verification
    if (reference.startsWith('rev_')) {
      const bookingId = reference.split('_')[2];
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.travelerId !== userId) throw new BadRequestException('Not authorized');

      // Rely on the webhook to mark it as PAID.
      return { 
        success: booking.paymentStatus === PaymentStatus.PAID, 
        status: booking.paymentStatus, 
        bookingId 
      };
    }

    // 4. Paystack payment verification (default fallback)
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key is not configured',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackApiUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          },
        ),
      );

      const data = response.data.data;

      if (data.status === 'success') {
        const bookingId = data.reference.split('_')[1];

        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
        });
        if (!booking) {
          throw new NotFoundException('Booking not found');
        }

        if (booking.travelerId !== userId) {
          throw new BadRequestException(
            'You do not have permission to verify this booking',
          );
        }

        if (booking.paymentStatus !== PaymentStatus.PAID) {
          await this.confirmBookingOnPayment(bookingId, 'PAYSTACK');
        }

        return { success: true, status: data.status, bookingId };
      }

      return { success: false, status: data.status };
    } catch (error: any) {
      this.logger.error(
        'Failed to verify Paystack payment',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Payment verification failed');
    }
  }

  async initializeExcessLuggagePayment(
    excessLuggageId: string,
    callbackUrl?: string,
    gateway?: string,
  ) {
    const luggage = await this.prisma.excessLuggage.findUnique({
      where: { id: excessLuggageId },
      include: { booking: { include: { traveler: true, transport: true } } },
    });

    if (!luggage) {
      throw new NotFoundException('Excess luggage charge not found');
    }

    if (luggage.status === PaymentStatus.PAID) {
      throw new BadRequestException('Excess luggage is already paid');
    }

    const fallbackCallbackUrl = `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/excess-luggage`;
    const finalCallbackUrl = callbackUrl || fallbackCallbackUrl;

    if (gateway === 'PAYPAL') {
      if (!this.paypalClientId || !this.paypalClientSecret) {
        throw new InternalServerErrorException('PayPal credentials are not configured');
      }
      const txRef = `el_ppal_${normalizeCountryCode(luggage.booking.transport.departureCountry)}_${luggage.id}_${Date.now()}`;
      const redirectUrl = finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=${txRef}` : `${finalCallbackUrl}?reference=${txRef}`;
      
      let paymentCurrency = luggage.currency || 'USD';
      let paymentAmount = Number(luggage.amount);
      const PAYPAL_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
      if (!PAYPAL_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        const rateToUSD = this.EXCHANGE_RATES_TO_USD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      try {
        const paypalApiUrl = this.paypalEnvironment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        const authString = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64');
        const tokenResponse = await firstValueFrom(
          this.httpService.post(`${paypalApiUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: { Authorization: `Basic ${authString}`, 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
        const orderPayload = {
          intent: 'CAPTURE',
          purchase_units: [{ reference_id: txRef, amount: { currency_code: paymentCurrency, value: paymentAmount.toFixed(2) } }],
          application_context: { return_url: redirectUrl, cancel_url: redirectUrl }
        };
        const orderResponse = await firstValueFrom(
          this.httpService.post(`${paypalApiUrl}/v2/checkout/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}`, 'Content-Type': 'application/json' }
          })
        );
        const approvalUrl = orderResponse.data.links.find((link: any) => link.rel === 'approve')?.href;
        return { authorization_url: approvalUrl, reference: txRef };
      } catch (error: any) {
        throw new InternalServerErrorException('PayPal payment initialization failed');
      }
    }

    if (gateway === 'REVOLUT') {
      if (!this.revolutSecretKey) {
        throw new InternalServerErrorException('Revolut secret key is not configured');
      }
      const txRef = `el_rev_${normalizeCountryCode(luggage.booking.transport.departureCountry)}_${luggage.id}_${Date.now()}`;
      const redirectUrl = finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=${txRef}` : `${finalCallbackUrl}?reference=${txRef}`;
      
      let paymentCurrency = luggage.currency || 'USD';
      let paymentAmount = Number(luggage.amount);
      const REVOLUT_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY', 'NZD', 'PLN', 'SEK', 'ZAR'];
      if (!REVOLUT_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
        const rateToUSD = this.EXCHANGE_RATES_TO_USD[paymentCurrency] || 1;
        paymentAmount = paymentAmount * rateToUSD;
        paymentCurrency = 'USD';
      }

      try {
        const revolutApiUrl = this.revolutEnvironment === 'sandbox' ? 'https://sandbox-merchant.revolut.com' : 'https://merchant.revolut.com';
        const orderPayload = {
          amount: Math.round(paymentAmount * 100),
          currency: paymentCurrency,
          merchant_order_ext_ref: txRef,
          customer_email: luggage.booking.traveler.email,
          description: `SmatWay Excess Luggage #${luggage.id.slice(0, 8)}`,
          redirect_url: redirectUrl
        };
        const orderResponse = await firstValueFrom(
          this.httpService.post(`${revolutApiUrl}/api/1.0/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${this.revolutSecretKey}`, 'Content-Type': 'application/json' }
          })
        );
        return { authorization_url: orderResponse.data.checkout_url, reference: txRef };
      } catch (error: any) {
        throw new InternalServerErrorException('Revolut payment initialization failed');
      }
    }

    if (gateway === 'FLUTTERWAVE') {
      if (!this.flutterwaveSecretKey) {
        throw new InternalServerErrorException('Flutterwave secret key is not configured');
      }
      const txRef = `el_flw_${normalizeCountryCode(luggage.booking.transport.departureCountry)}_${luggage.id}_${Date.now()}`;
      const payload = {
        tx_ref: txRef,
        amount: Number(luggage.amount),
        currency: luggage.currency || 'NGN',
        redirect_url: finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=${txRef}` : `${finalCallbackUrl}?reference=${txRef}`,
        customer: {
          email: luggage.booking.traveler.email || 'traveler@smatway.com',
          name: luggage.booking.traveler.name || 'Traveler',
        },
        customizations: {
          title: 'SmatWay Excess Luggage Payment',
          description: luggage.description || 'Excess luggage charge',
        },
        meta: {
          excessLuggageId: luggage.id,
          bookingId: luggage.bookingId,
        },
      };

      try {
        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.flutterwave.com/v3/payments',
            payload,
            {
              headers: {
                Authorization: `Bearer ${this.flutterwaveSecretKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );
        return { authorization_url: response.data.data.link, reference: txRef };
      } catch (error: any) {
        throw new InternalServerErrorException(
          error.response?.data?.message || 'Flutterwave payment initialization failed',
        );
      }
    }

    // Default to Paystack for simplicity
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key is not configured',
      );
    }

    let paymentCurrency = luggage.currency || 'NGN';
    let paymentAmount = Number(luggage.amount);

    const PAYSTACK_SUPPORTED_CURRENCIES = ['NGN'];
    if (!PAYSTACK_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
      const rateUSDToNGN = 1 / 0.00067;
      if (paymentCurrency === 'USD') {
        paymentAmount = paymentAmount * rateUSDToNGN;
      } else {
        const rateToUSD = this.EXCHANGE_RATES_TO_USD[paymentCurrency] || 1;
        paymentAmount = (paymentAmount * rateToUSD) * rateUSDToNGN;
      }
      paymentCurrency = 'NGN';
    }

    const amountInMinorUnits = Math.round(paymentAmount * 100);

    const payload = {
      amount: amountInMinorUnits,
      email: luggage.booking.traveler.email || 'traveler@smatway.com',
      reference: `el_${normalizeCountryCode(luggage.booking.transport.departureCountry)}_${luggage.id}_${Date.now()}`,
      currency: paymentCurrency,
      callback_url: finalCallbackUrl.includes('?') ? `${finalCallbackUrl}&reference=el_${luggage.id}` : `${finalCallbackUrl}?reference=el_${luggage.id}`,
      metadata: {
        excessLuggageId: luggage.id,
        bookingId: luggage.bookingId,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.paystackApiUrl}/transaction/initialize`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data.data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Payment initialization failed',
      );
    }
  }

  async verifyExcessLuggagePayment(reference: string) {
    if (reference.startsWith('el_ppal_')) {
      const luggageId = reference.split('_')[3];
      const luggage = await this.prisma.excessLuggage.findUnique({ where: { id: luggageId } });
      if (!luggage) throw new NotFoundException('Excess luggage charge not found');
      return { success: luggage.status === PaymentStatus.PAID, status: luggage.status, excessLuggageId: luggageId };
    }

    if (reference.startsWith('el_flw_')) {
      const parts = reference.split('_');
      const luggageId = parts[3];
      const luggage = await this.prisma.excessLuggage.findUnique({ where: { id: luggageId } });
      if (!luggage) throw new NotFoundException('Excess luggage charge not found');

      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
            {
              headers: { Authorization: `Bearer ${this.flutterwaveSecretKey}` },
            },
          ),
        );
        const data = response.data?.data;
        if (data && data.status === 'successful') {
          await this.prisma.excessLuggage.update({
            where: { id: luggageId },
            data: { status: PaymentStatus.PAID, paymentMethod: PaymentMethod.FLUTTERWAVE },
          });
          return { success: true, status: 'PAID', excessLuggageId: luggageId };
        }
      } catch (e) {
        // Fallback
      }
      return { success: luggage.status === PaymentStatus.PAID, status: luggage.status, excessLuggageId: luggageId };
    }

    if (reference.startsWith('el_rev_')) {
      const luggageId = reference.split('_')[3];
      const luggage = await this.prisma.excessLuggage.findUnique({ where: { id: luggageId } });
      if (!luggage) throw new NotFoundException('Excess luggage charge not found');
      return { success: luggage.status === PaymentStatus.PAID, status: luggage.status, excessLuggageId: luggageId };
    }

    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key is not configured',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackApiUrl}/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${this.paystackSecretKey}` },
          },
        ),
      );

      const data = response.data.data;
      if (data.status === 'success') {
        const luggageId = data.reference.split('_')[2]; // el_COUNTRY_LUGGAGEID_TIMESTAMP
        const luggage = await this.prisma.excessLuggage.findUnique({
          where: { id: luggageId },
        });

        if (luggage && luggage.status !== PaymentStatus.PAID) {
          await this.prisma.excessLuggage.update({
            where: { id: luggageId },
            data: { status: PaymentStatus.PAID, paymentMethod: 'PAYSTACK' },
          });
        }
        return {
          success: true,
          status: data.status,
          excessLuggageId: luggageId,
        };
      }
      return { success: false, status: data.status };
    } catch (error: any) {
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
      const parts = data.reference.split('_');
      if (parts[0] === 'el') {
        // Excess luggage
        const luggageId = parts[2];
        const luggage = await this.prisma.excessLuggage.findUnique({
          where: { id: luggageId },
        });
        if (luggage && luggage.status !== PaymentStatus.PAID) {
          await this.prisma.excessLuggage.update({
            where: { id: luggageId },
            data: { status: PaymentStatus.PAID, paymentMethod: 'PAYSTACK' },
          });
        }
      } else {
        const bookingId = parts[1];

        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
        });
        if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
          await this.confirmBookingOnPayment(bookingId, 'PAYSTACK');
          this.logger.log(`Booking ${bookingId} marked as PAID via webhook`);
        }
      }
    }
  }

  async handleFlutterwaveWebhook(signature: string, payload: any) {
    if (
      this.flutterwaveWebhookHash &&
      signature !== this.flutterwaveWebhookHash
    ) {
      this.logger.warn('Invalid Flutterwave webhook signature');
      return;
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed' && data.status === 'successful') {
      const txRef = data.tx_ref;
      if (txRef && txRef.startsWith('flw_')) {
        const bookingId = txRef.split('_')[2];

        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
        });
        if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
          await this.confirmBookingOnPayment(bookingId, 'FLUTTERWAVE');
          this.logger.log(
            `Booking ${bookingId} marked as PAID via Flutterwave webhook`,
          );
        }
      }
    }
  }

  async handlePaypalWebhook(payload: any) {
    // Minimal handler. In production, verify signature.
    const eventType = payload.event_type;
    const resource = payload.resource;
    
    // Sometimes PayPal includes the reference id in custom_id or invoice_id. We'll check custom_id.
    // If it's a CHECKOUT.ORDER.APPROVED event we can also capture it. For now, assuming direct capture.
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      let txRef = resource.custom_id;
      // In checkout v2, it could be under purchase_units[0].reference_id
      if (!txRef && resource.purchase_units && resource.purchase_units[0]) {
        txRef = resource.purchase_units[0].reference_id;
      }

      if (txRef && txRef.startsWith('ppal_')) {
        const bookingId = txRef.split('_')[2];
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
          await this.confirmBookingOnPayment(bookingId, 'PAYPAL');
          this.logger.log(`Booking ${bookingId} marked as PAID via PayPal webhook`);
        }
      } else if (txRef && txRef.startsWith('el_ppal_')) {
        const luggageId = txRef.split('_')[3];
        const luggage = await this.prisma.excessLuggage.findUnique({ where: { id: luggageId } });
        if (luggage && luggage.status !== PaymentStatus.PAID) {
          await this.prisma.excessLuggage.update({
            where: { id: luggageId },
            data: { status: PaymentStatus.PAID, paymentMethod: 'PAYPAL' },
          });
        }
      }
    }
  }

  async handleRevolutWebhook(payload: any) {
    const event = payload.event;
    const orderExtRef = payload.merchant_order_ext_ref;

    if (event === 'ORDER_COMPLETED') {
      if (orderExtRef && orderExtRef.startsWith('rev_')) {
        const bookingId = orderExtRef.split('_')[2];
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.paymentStatus !== PaymentStatus.PAID) {
          await this.confirmBookingOnPayment(bookingId, 'REVOLUT');
          this.logger.log(`Booking ${bookingId} marked as PAID via Revolut webhook`);
        }
      } else if (orderExtRef && orderExtRef.startsWith('el_rev_')) {
        const luggageId = orderExtRef.split('_')[3];
        const luggage = await this.prisma.excessLuggage.findUnique({ where: { id: luggageId } });
        if (luggage && luggage.status !== PaymentStatus.PAID) {
          await this.prisma.excessLuggage.update({
            where: { id: luggageId },
            data: { status: PaymentStatus.PAID, paymentMethod: 'REVOLUT' },
          });
        }
      }
    }
  }

  async confirmBookingOnPayment(bookingId: string, paymentMethod: PaymentMethod) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        transport: {
          include: { transporter: { select: { id: true, name: true } } },
        },
      },
    });
    if (!booking) return;

    if (booking.paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.CONFIRMED) {
      return;
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        paymentMethod,
      },
    });

    this.chatGateway.notifyUser(booking.travelerId, {
      type: 'booking_confirmed',
      bookingId: booking.id,
      transporter: booking.transport.transporter,
      route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
    });

    const traveler = await this.prisma.user.findUnique({
      where: { id: booking.travelerId },
      select: { email: true, name: true },
    });
    if (traveler?.email) {
      const transporterName =
        booking.transport.transporter.name || 'SmatWay Transporter';
      await this.mailService
        .sendBookingTicketEmail(traveler.email, {
          bookingId: booking.id,
          passengerName: traveler.name,
          bookingNumber: booking.bookingNumber,
          route: `${booking.transport.departureCity} -> ${booking.transport.destinationCity}`,
          dateTime: booking.transport.departureDateTime.toISOString(),
          seats: booking.seatsBooked,
          price: `${booking.transport.currency} ${booking.totalPrice}`,
          transporterName,
        })
        .catch((err: any) =>
          this.logger.error('Failed to send booking ticket email', err),
        );
    }

    return updated;
  }
}
