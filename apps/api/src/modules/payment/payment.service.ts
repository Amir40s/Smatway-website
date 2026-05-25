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

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async initializePayment(bookingId: string, userId: string) {
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException('Paystack secret key is not configured');
    }

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
  const amountInMinorUnits = Math.round(Number(booking.totalPrice) * 100);

    const payload = {
      amount: amountInMinorUnits,
      email: booking.traveler.email,
      reference: `${booking.id}_${Date.now()}`, // Using unique reference to avoid duplicate transaction errors
      currency: booking.transport.currency || 'NGN',
      callback_url: `${process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/traveler/booking/${booking.id}`,
      metadata: {
        bookingId: booking.id,
        travelerId: booking.travelerId,
      },
    };

    try {
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
}
