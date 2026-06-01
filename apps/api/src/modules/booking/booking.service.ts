import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(travelerId: string, dto: CreateBookingDto) {
    const transport = await this.prisma.transport.findUnique({ where: { id: dto.transportId } });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.availableSeats < dto.seatsBooked)
      throw new BadRequestException('Not enough seats available');

    const totalPrice = Number(transport.price) * dto.seatsBooked;

    const [booking] = await this.prisma.$transaction([
      this.prisma.booking.create({
        data: {
          travelerId,
          transportId: dto.transportId,
          seatsBooked: dto.seatsBooked,
          totalPrice,
          paymentMethod: dto.paymentMethod,
        },
        include: { transport: true },
      }),
      this.prisma.transport.update({
        where: { id: dto.transportId },
        data: { availableSeats: { decrement: dto.seatsBooked } },
      }),
    ]);

    // Notify the transporter in real-time
    const traveler = await this.prisma.user.findUnique({
      where: { id: travelerId },
      select: { id: true, name: true },
    });
    this.chatGateway.notifyUser(transport.transporterId, {
      type: 'booking',
      bookingId: booking.id,
      traveler,
      seatsBooked: dto.seatsBooked,
      totalPrice,
      route: `${transport.departureCity} → ${transport.destinationCity}`,
    });

    return booking;
  }

  async myBookings(travelerId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { travelerId },
      include: {
        transport: {
          include: {
            vehicle: true,
            transporter: { select: { id: true, name: true, phoneNumber: true, profile: { select: { companyName: true } } } },
            stops: { orderBy: { stopOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      bookings.map(async (booking: any) => ({
        ...booking,
        transport: {
          ...booking.transport,
          vehicle: booking.transport.vehicle
            ? {
              ...booking.transport.vehicle,
              imageUrl: booking.transport.vehicle.imageUrl
                ? await this.storageService.resolveImageUrl(booking.transport.vehicle.imageUrl)
                : null,
            }
            : null,
          transporter: booking.transport.transporter
            ? {
                ...booking.transport.transporter,
                name: booking.transport.transporter.profile?.companyName || booking.transport.transporter.name,
              }
            : null,
        },
      })),
    );
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        traveler: { select: { id: true, name: true, phoneNumber: true, email: true, avatarUrl: true } },
        transport: {
          include: { 
            vehicle: true,
            transporter: { select: { id: true, name: true, phoneNumber: true, profile: { select: { companyName: true } } } },
            stops: { orderBy: { stopOrder: 'asc' } }
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.travelerId !== userId && booking.transport.transporterId !== userId)
      throw new ForbiddenException();
      
    if (booking.transport?.transporter) {
      booking.transport.transporter.name = booking.transport.transporter.profile?.companyName || booking.transport.transporter.name;
    }

    let resolvedVehicle = booking.transport.vehicle;
    if (resolvedVehicle?.imageUrl) {
      resolvedVehicle.imageUrl = await this.storageService.resolveImageUrl(resolvedVehicle.imageUrl);
    }
    
    let resolvedTraveler = booking.traveler;
    if (resolvedTraveler?.avatarUrl) {
      resolvedTraveler.avatarUrl = await this.storageService.resolveImageUrl(resolvedTraveler.avatarUrl);
    }

    return {
      ...booking,
      traveler: resolvedTraveler,
      transport: {
        ...booking.transport,
        vehicle: resolvedVehicle,
      }
    };
  }

  async allTransporterBookings(transporterId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        transport: { transporterId },
      },
      include: {
        transport: { include: { vehicle: true, stops: { orderBy: { stopOrder: 'asc' } } } },
        traveler: { select: { id: true, name: true, phoneNumber: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      bookings.map(async (booking: any) => ({
        ...booking,
        transport: {
          ...booking.transport,
          vehicle: booking.transport.vehicle
            ? {
              ...booking.transport.vehicle,
              imageUrl: booking.transport.vehicle.imageUrl
                ? await this.storageService.resolveImageUrl(booking.transport.vehicle.imageUrl)
                : null,
            }
            : null,
        },
        user: booking.traveler
          ? {
            ...booking.traveler,
            avatarUrl: booking.traveler.avatarUrl
              ? await this.storageService.resolveImageUrl(booking.traveler.avatarUrl)
              : null,
          }
          : null,
      })),
    );
  }

  async transportBookings(transportId: string, transporterId: string) {
    const transport = await this.prisma.transport.findUnique({ where: { id: transportId } });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId) throw new ForbiddenException();

    const bookings = await this.prisma.booking.findMany({
      where: { transportId },
      include: {
        transport: { include: { vehicle: true, stops: { orderBy: { stopOrder: 'asc' } } } },
        traveler: { select: { id: true, name: true, phoneNumber: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      bookings.map(async (booking: any) => ({
        ...booking,
        transport: {
          ...booking.transport,
          vehicle: booking.transport.vehicle
            ? {
              ...booking.transport.vehicle,
              imageUrl: booking.transport.vehicle.imageUrl
                ? await this.storageService.resolveImageUrl(booking.transport.vehicle.imageUrl)
                : null,
            }
            : null,
        },
        user: booking.traveler
          ? {
            ...booking.traveler,
            avatarUrl: booking.traveler.avatarUrl
              ? await this.storageService.resolveImageUrl(booking.traveler.avatarUrl)
              : null,
          }
          : null,
      })),
    );
  }

  async cancel(id: string, travelerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        transport: true,
        traveler: { select: { id: true, name: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.travelerId !== travelerId) throw new ForbiddenException();
    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Already cancelled');
    if (booking.paymentStatus === PaymentStatus.PAID)
      throw new BadRequestException('Paid bookings cannot be cancelled');

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
      }),
      this.prisma.transport.update({
        where: { id: booking.transportId },
        data: { availableSeats: { increment: booking.seatsBooked } },
      }),
    ]);

    // Notify the transporter about the cancellation
    this.chatGateway.notifyUser(booking.transport.transporterId, {
      type: 'booking_cancelled',
      bookingId: booking.id,
      traveler: booking.traveler,
      seatsBooked: booking.seatsBooked,
      route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
    });

    return updated;
  }

  async confirm(id: string, transporterId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        transport: { include: { transporter: { select: { id: true, name: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.transport.transporterId !== transporterId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Only pending bookings can be confirmed');

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });

    this.chatGateway.notifyUser(booking.travelerId, {
      type: 'booking_confirmed',
      bookingId: booking.id,
      transporter: booking.transport.transporter,
      route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
    });

    return updated;
  }

  async reject(id: string, transporterId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        transport: { include: { transporter: { select: { id: true, name: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.transport.transporterId !== transporterId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Only pending bookings can be rejected');

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
      }),
      this.prisma.transport.update({
        where: { id: booking.transportId },
        data: { availableSeats: { increment: booking.seatsBooked } },
      }),
    ]);

    this.chatGateway.notifyUser(booking.travelerId, {
      type: 'booking_rejected',
      bookingId: booking.id,
      transporter: booking.transport.transporter,
      route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
    });

    return updated;
  }

  async complete(id: string, transporterId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        transport: { include: { transporter: { select: { id: true, name: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.transport.transporterId !== transporterId) throw new ForbiddenException();

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });

    this.chatGateway.notifyUser(booking.travelerId, {
      type: 'booking_completed',
      bookingId: booking.id,
      transporter: booking.transport.transporter,
      route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
    });

    return updated;
  }

  async updatePaymentMethod(id: string, travelerId: string, paymentMethod: PaymentMethod) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.travelerId !== travelerId) throw new ForbiddenException();

    return this.prisma.booking.update({
      where: { id },
      data: { paymentMethod },
    });
  }

  async getAllBookings() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        traveler: { select: { id: true, name: true, email: true, phoneNumber: true, avatarUrl: true } },
        transport: {
          include: {
            vehicle: { select: { name: true, plateNumber: true } },
            transporter: { select: { id: true, name: true, profile: { select: { companyName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      bookings.map(async (booking: any) => ({
        ...booking,
        traveler: booking.traveler
          ? {
              ...booking.traveler,
              avatarUrl: booking.traveler.avatarUrl
                ? await this.storageService.resolveImageUrl(booking.traveler.avatarUrl)
                : null,
            }
          : null,
      })),
    );
  }

  async updateBookingAdmin(id: string, dto: { status?: BookingStatus; paymentStatus?: PaymentStatus }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { transport: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (dto.status === BookingStatus.CANCELLED && booking.status !== BookingStatus.CANCELLED) {
      await this.prisma.transport.update({
        where: { id: booking.transportId },
        data: { availableSeats: { increment: booking.seatsBooked } },
      });
    } else if (dto.status && dto.status !== BookingStatus.CANCELLED && booking.status === BookingStatus.CANCELLED) {
      await this.prisma.transport.update({
        where: { id: booking.transportId },
        data: { availableSeats: { decrement: booking.seatsBooked } },
      });
    }

    return this.prisma.booking.update({
      where: { id },
      data: dto,
    });
  }
}
