import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class ExcessLuggageService {
  constructor(private readonly prisma: PrismaService) {}

  async createCharge(bookingNumber: string, amount: number, description?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingNumber },
      include: { transport: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.excessLuggage.create({
      data: {
        bookingId: booking.id,
        amount,
        currency: booking.transport.currency || 'USD',
        description,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async getChargesByBookingNumber(bookingNumber: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingNumber },
      include: { excessLuggages: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking.excessLuggages;
  }
}
