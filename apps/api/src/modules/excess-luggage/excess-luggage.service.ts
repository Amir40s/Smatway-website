import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class ExcessLuggageService {
  constructor(private readonly prisma: PrismaService) {}

  async createCharge(bookingIdOrNumber: string, amount: number, description?: string) {
    const searchStr = bookingIdOrNumber.trim();
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [
          { id: searchStr },
          { bookingNumber: searchStr },
          { bookingNumber: searchStr.toUpperCase() },
          { bookingNumber: searchStr.toLowerCase() },
          { id: { startsWith: searchStr.toLowerCase().replace('#', '') } },
        ],
      },
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

  async getChargesByBookingId(bookingIdOrNumber: string) {
    const searchStr = bookingIdOrNumber.trim();
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [
          { id: searchStr },
          { bookingNumber: searchStr },
          { bookingNumber: searchStr.toUpperCase() },
          { bookingNumber: searchStr.toLowerCase() },
          { id: { startsWith: searchStr.toLowerCase().replace('#', '') } },
        ],
      },
      include: {
        excessLuggages: true,
        transport: { include: { vehicle: true } },
        traveler: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found. Please verify the ticket number.');
    }

    return {
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber || `#${booking.id.slice(0, 8).toUpperCase()}`,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        seatsBooked: booking.seatsBooked,
        totalPrice: booking.totalPrice,
        currency: booking.transport.currency || 'NGN',
        travelerName: booking.traveler?.name || 'Traveler',
        routeName: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
        vehicleName: booking.transport.vehicle ? booking.transport.vehicle.name : 'Assigned Vehicle',
      },
      excessLuggages: booking.excessLuggages,
    };
  }

  async getChargeById(id: string) {
    const charge = await this.prisma.excessLuggage.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            transport: true,
          },
        },
      },
    });

    if (!charge) {
      throw new NotFoundException('Excess luggage charge not found');
    }

    return charge;
  }
}
