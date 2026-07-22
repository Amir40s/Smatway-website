import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { SearchTransportDto } from './dto/search-transport.dto';
import { TransportStatus } from '@prisma/client';
import { getCountrySearchVariants } from '../../common/utils/country.util';

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async getTransporterStats(transporterId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { transporterId },
    });

    const completedRides = await this.prisma.booking.count({
      where: {
        transport: { transporterId },
        status: 'COMPLETED' as any,
      },
    });

    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
              reviews.length) *
              10,
          ) / 10
        : 0;

    return {
      averageRating: avgRating,
      totalCompletedRides: completedRides,
    };
  }

  async create(transporterId: string, dto: CreateTransportDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId)
      throw new ForbiddenException('Vehicle does not belong to you');

    const depDate = new Date(dto.departureDateTime);
    if (depDate < new Date()) {
      throw new BadRequestException('Departure date cannot be in the past');
    }

    const maxDate = new Date(dto.maxReachDateTime);
    if (maxDate < new Date()) {
      throw new BadRequestException('Max reach date cannot be in the past');
    }
    if (maxDate <= depDate) {
      throw new BadRequestException(
        'Max reach date must be after departure date',
      );
    }

    // Fallback currency resolution: DTO → transporter's preferredCurrency → USD
    let currency = (dto.currency || '').toUpperCase();
    if (!currency) {
      const transporter = await this.prisma.user.findUnique({
        where: { id: transporterId },
        select: { preferredCurrency: true },
      });
      currency = (transporter?.preferredCurrency || 'USD').toUpperCase();
    }

    const totalDays =
      dto.repeatDaily && dto.repeatDurationDays
        ? Math.min(Math.max(1, dto.repeatDurationDays), 30)
        : 1;

    if (totalDays === 1) {
      return this.prisma.transport.create({
        data: {
          transporterId,
          vehicleId: dto.vehicleId,
          departureCountry: dto.departureCountry.trim(),
          departureCity: dto.departureCity.trim(),
          departureAddress: dto.departureAddress.trim(),
          destinationCountry: dto.destinationCountry.trim(),
          destinationCity: dto.destinationCity.trim(),
          destinationAddress: dto.destinationAddress.trim(),
          transportType: vehicle.transportType,
          price: dto.price,
          currency,
          availableSeats: dto.availableSeats,
          departureDateTime: depDate,
          maxReachDateTime: maxDate,
          stops: {
            create: (dto.stops || []).map((s, index) => ({
              city: s.city.trim(),
              address: s.address.trim(),
              stopOrder: index,
            })),
          },
        },
        include: { vehicle: true, stops: { orderBy: { stopOrder: 'asc' } } },
      });
    }

    const creations = Array.from({ length: totalDays }, (_, i) => {
      const offsetMs = i * 24 * 60 * 60 * 1000;
      const currentDepDate = new Date(depDate.getTime() + offsetMs);
      const currentMaxDate = new Date(maxDate.getTime() + offsetMs);

      return this.prisma.transport.create({
        data: {
          transporterId,
          vehicleId: dto.vehicleId,
          departureCountry: dto.departureCountry.trim(),
          departureCity: dto.departureCity.trim(),
          departureAddress: dto.departureAddress.trim(),
          destinationCountry: dto.destinationCountry.trim(),
          destinationCity: dto.destinationCity.trim(),
          destinationAddress: dto.destinationAddress.trim(),
          transportType: vehicle.transportType,
          price: dto.price,
          currency,
          availableSeats: dto.availableSeats,
          departureDateTime: currentDepDate,
          maxReachDateTime: currentMaxDate,
          stops: {
            create: (dto.stops || []).map((s, index) => ({
              city: s.city.trim(),
              address: s.address.trim(),
              stopOrder: index,
            })),
          },
        },
        include: { vehicle: true, stops: { orderBy: { stopOrder: 'asc' } } },
      });
    });

    const results = await this.prisma.$transaction(creations);
    return results[0];
  }

  async search(dto: SearchTransportDto) {
    const now = new Date();
    const where: any = {
      status: TransportStatus.ACTIVE,
      maxReachDateTime: { gte: now },
      deleteRequested: false,
      vehicle: {
        deleted: false,
      },
      transporter: {
        isSuspended: false,
        deletedAt: null,
      },
    };

    if (dto.transportType) where.transportType = dto.transportType;

    const andFilters: any[] = [];

    if (dto.departureCity) {
      const depCityTrim = dto.departureCity.trim();
      andFilters.push({
        OR: [
          { departureCity: { contains: depCityTrim, mode: 'insensitive' } },
          {
            stops: {
              some: { city: { contains: depCityTrim, mode: 'insensitive' } },
            },
          },
        ],
      });
    }

    if (dto.departureCountry) {
      const variants = getCountrySearchVariants(dto.departureCountry);
      andFilters.push({
        OR: variants.map((v) => ({
          departureCountry: { contains: v, mode: 'insensitive' },
        })),
      });
    }

    if (dto.destinationCity) {
      const destCityTrim = dto.destinationCity.trim();
      andFilters.push({
        OR: [
          { destinationCity: { contains: destCityTrim, mode: 'insensitive' } },
          {
            stops: {
              some: { city: { contains: destCityTrim, mode: 'insensitive' } },
            },
          },
        ],
      });
    }

    if (dto.destinationCountry) {
      const variants = getCountrySearchVariants(dto.destinationCountry);
      andFilters.push({
        OR: variants.map((v) => ({
          destinationCountry: { contains: v, mode: 'insensitive' },
        })),
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }
    if (dto.date) {
      const d = new Date(dto.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.departureDateTime = { gte: d, lt: next };
    }

    const transports = await this.prisma.transport.findMany({
      where,
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profileImageUrl: true,
            avatarUrl: true,
            profile: { select: { companyName: true } },
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            model: true,
            transportType: true,
            plateNumber: true,
            imageUrl: true,
            features: true,
          },
        },
        stops: { orderBy: { stopOrder: 'asc' } },
      },
      orderBy: { departureDateTime: 'asc' },
    });

    // Chronological Stop-Order Filtering: Ensure traveler's departure precedes destination along the route.
    const validTransports = transports.filter((transport) => {
      const depCity = dto.departureCity
        ? dto.departureCity.trim().toLowerCase()
        : null;
      const destCity = dto.destinationCity
        ? dto.destinationCity.trim().toLowerCase()
        : null;

      let depIndex = -2;
      let destIndex = -2;

      // Resolve departure city index
      if (!depCity) {
        depIndex = -1;
      } else if (transport.departureCity.toLowerCase().includes(depCity)) {
        depIndex = -1;
      } else {
        const stopIdx = transport.stops.findIndex((s) =>
          s.city.toLowerCase().includes(depCity),
        );
        if (stopIdx !== -1) {
          depIndex = stopIdx;
        }
      }

      // Resolve destination city index
      if (!destCity) {
        destIndex = 999999;
      } else if (transport.destinationCity.toLowerCase().includes(destCity)) {
        destIndex = 999999;
      } else {
        const stopIdx = transport.stops.findIndex((s) =>
          s.city.toLowerCase().includes(destCity),
        );
        if (stopIdx !== -1) {
          destIndex = stopIdx;
        }
      }

      // Filter out if requested cities were not matched, or if departure is chronological after destination
      if (depIndex === -2 || destIndex === -2 || depIndex >= destIndex) {
        return false;
      }
      return true;
    });

    return Promise.all(
      validTransports.map(async (transport: any) => {
        const stats = await this.getTransporterStats(transport.transporterId);
        return {
          ...transport,
          transporter: {
            ...transport.transporter,
            name:
              transport.transporter.profile?.companyName ||
              transport.transporter.name,
            profileImageUrl: await this.storageService.resolveImageUrl(
              transport.transporter.profileImageUrl ||
                transport.transporter.avatarUrl,
            ),
            ...stats,
          },
          vehicle: transport.vehicle
            ? {
                ...transport.vehicle,
                imageUrl: await this.storageService.resolveImageUrl(
                  transport.vehicle.imageUrl,
                ),
              }
            : null,
        };
      }),
    );
  }

  async findOne(id: string) {
    const transport: any = await this.prisma.transport.findUnique({
      where: { id },
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profileImageUrl: true,
            avatarUrl: true,
            profile: { select: { companyName: true } },
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            model: true,
            transportType: true,
            plateNumber: true,
            imageUrl: true,
            features: true,
          },
        },
        stops: { orderBy: { stopOrder: 'asc' } },
      },
    });
    if (!transport) throw new NotFoundException('Transport not found');

    const stats = await this.getTransporterStats(transport.transporterId);

    return {
      ...transport,
      transporter: {
        ...transport.transporter,
        name:
          transport.transporter.profile?.companyName ||
          transport.transporter.name,
        profileImageUrl: await this.storageService.resolveImageUrl(
          transport.transporter.profileImageUrl,
        ),
        ...stats,
      },
      vehicle: transport.vehicle
        ? {
            ...transport.vehicle,
            imageUrl: await this.storageService.resolveImageUrl(
              transport.vehicle.imageUrl,
            ),
          }
        : null,
    };
  }

  async getAllTransports() {
    const transports = await this.prisma.transport.findMany({
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profile: { select: { companyName: true } },
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            model: true,
            transportType: true,
            plateNumber: true,
            features: true,
          },
        },
        stops: { orderBy: { stopOrder: 'asc' } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      transports.map(async (transport: any) => ({
        ...transport,
        transporter: {
          ...transport.transporter,
          name:
            transport.transporter?.profile?.companyName ||
            transport.transporter?.name ||
            '',
        },
      })),
    );
  }

  async myRoutes(transporterId: string) {
    const transports = await this.prisma.transport.findMany({
      where: { transporterId },
      include: {
        vehicle: true,
        stops: { orderBy: { stopOrder: 'asc' } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await this.getTransporterStats(transporterId);

    return Promise.all(
      transports.map(async (transport: any) => ({
        ...transport,
        transporterStats: stats,
        vehicle: transport.vehicle
          ? {
              ...transport.vehicle,
              imageUrl: await this.storageService.resolveImageUrl(
                transport.vehicle.imageUrl,
              ),
            }
          : null,
      })),
    );
  }

  async update(
    id: string,
    transporterId: string,
    dto: Partial<CreateTransportDto>,
  ) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId)
      throw new ForbiddenException();

    let transportType: typeof transport.transportType | undefined;
    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle || vehicle.transporterId !== transporterId)
        throw new ForbiddenException('Invalid vehicle');
      transportType = vehicle.transportType;
    }

    const finalDepDate = dto.departureDateTime
      ? new Date(dto.departureDateTime)
      : new Date(transport.departureDateTime);
    const finalMaxDate = dto.maxReachDateTime
      ? new Date(dto.maxReachDateTime)
      : new Date(transport.maxReachDateTime);

    if (dto.departureDateTime && finalDepDate < new Date()) {
      throw new BadRequestException('Departure date cannot be in the past');
    }
    if (dto.maxReachDateTime && finalMaxDate < new Date()) {
      throw new BadRequestException('Max reach date cannot be in the past');
    }
    if (finalMaxDate <= finalDepDate) {
      throw new BadRequestException(
        'Max reach date must be after departure date',
      );
    }

    const updateData: any = {
      ...dto,
      transportType,
      departureDateTime: dto.departureDateTime
        ? new Date(dto.departureDateTime)
        : undefined,
      maxReachDateTime: dto.maxReachDateTime
        ? new Date(dto.maxReachDateTime)
        : undefined,
    };

    if (dto.departureCountry)
      updateData.departureCountry = dto.departureCountry.trim();
    if (dto.departureCity) updateData.departureCity = dto.departureCity.trim();
    if (dto.departureAddress)
      updateData.departureAddress = dto.departureAddress.trim();
    if (dto.destinationCountry)
      updateData.destinationCountry = dto.destinationCountry.trim();
    if (dto.destinationCity)
      updateData.destinationCity = dto.destinationCity.trim();
    if (dto.destinationAddress)
      updateData.destinationAddress = dto.destinationAddress.trim();

    delete updateData.stops;
    if (dto.stops) {
      updateData.stops = {
        deleteMany: {},
        create: dto.stops.map((s, index) => ({
          city: s.city.trim(),
          address: s.address.trim(),
          stopOrder: index,
        })),
      };
    }

    return this.prisma.transport.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, transporterId: string, reason?: string) {
    const transport = await this.prisma.transport.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId)
      throw new ForbiddenException();

    if (transport._count?.bookings === 0) {
      return this.prisma.transport.delete({ where: { id } });
    }

    return this.prisma.transport.update({
      where: { id },
      data: { status: TransportStatus.INACTIVE, deleteRequested: true, deleteReason: reason },
    });
  }

  async approveDelete(id: string) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');
    return this.prisma.transport.delete({ where: { id } });
  }

  async rejectDelete(id: string) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');
    return this.prisma.transport.update({
      where: { id },
      data: { deleteRequested: false },
    });
  }

  async deleteByVehicle(vehicleId: string, transporterId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException();

    return this.prisma.transport.updateMany({
      where: { vehicleId },
      data: { status: TransportStatus.INACTIVE },
    });
  }

  async getTripManifest(transportId: string, transporterId: string) {
    const transport = await this.prisma.transport.findUnique({
      where: { id: transportId },
      include: {
        vehicle: true,
        transporter: { select: { id: true, name: true } },
        bookings: {
          include: {
            traveler: { select: { id: true, name: true, phoneNumber: true } },
            excessLuggages: true,
          },
        },
      },
    });

    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId) throw new ForbiddenException();

    const paidBookings = transport.bookings.filter(
      (b) => b.paymentStatus === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED',
    );

    const totalTravelers = paidBookings.reduce((sum, b) => sum + b.seatsBooked, 0);
    const totalFaresPaid = paidBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);

    const totalExcessLuggagePaid = paidBookings.reduce((sum, b) => {
      const paidCharges = b.excessLuggages.filter((el) => el.status === 'PAID');
      return sum + paidCharges.reduce((s, el) => s + Number(el.amount), 0);
    }, 0);

    const grossTotal = totalFaresPaid + totalExcessLuggagePaid;
    const commissionRate = 0.10; // 10% Platform Commission
    const platformCommission = Math.round(grossTotal * commissionRate * 100) / 100;
    const netPayoutToTransporter = Math.round((grossTotal - platformCommission) * 100) / 100;

    const isCompleted = transport.status === TransportStatus.INACTIVE || (transport.maxReachDateTime ? new Date(transport.maxReachDateTime) < new Date() : false);
    const payoutStatus = isCompleted ? 'Payment Processed' : 'Pending Trip Completion';

    const manifestTravelers = paidBookings.map((b) => {
      const parts = (b.traveler?.name || 'Traveler').trim().split(/\s+/);
      const firstName = parts[0] || 'Traveler';
      const lastPart = parts[parts.length - 1] || '';
      const maskedName = parts.length > 1 && lastPart ? `${firstName} ${lastPart.charAt(0).toUpperCase()}.` : firstName;
      return {
        bookingId: b.id,
        bookingNumber: b.bookingNumber || `#${b.id.slice(0, 8)}`,
        maskedName,
        seatsBooked: b.seatsBooked,
        totalFare: b.totalPrice,
        excessLuggagePaid: b.excessLuggages.filter((el) => el.status === 'PAID').reduce((s, el) => s + Number(el.amount), 0),
        status: b.status,
      };
    });

    return {
      transportId: transport.id,
      route: `${transport.departureCity} (${transport.departureCountry}) → ${transport.destinationCity} (${transport.destinationCountry})`,
      vehicle: transport.vehicle ? `${transport.vehicle.name} (${transport.vehicle.plateNumber})` : 'Assigned Vehicle',
      departureDateTime: transport.departureDateTime,
      totalTravelersManifest: totalTravelers,
      totalFaresPaid,
      totalExcessLuggagePaid,
      grossTotal,
      platformCommissionRate: '10%',
      platformCommission,
      netPayoutToTransporter,
      payoutStatus,
      payoutStatusColor: isCompleted ? 'purple' : 'emerald',
      currency: transport.currency || 'NGN',
      travelers: manifestTravelers,
    };
  }
}
