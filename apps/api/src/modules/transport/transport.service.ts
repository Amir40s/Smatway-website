import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { SearchTransportDto } from './dto/search-transport.dto';
import { TransportStatus } from '@prisma/client';

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

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    return {
      averageRating: avgRating,
      totalCompletedRides: completedRides,
    };
  }

  async create(transporterId: string, dto: CreateTransportDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException('Vehicle does not belong to you');

    const depDate = new Date(dto.departureDateTime);
    if (depDate < new Date()) {
      throw new BadRequestException('Departure date cannot be in the past');
    }

    const maxDate = new Date(dto.maxReachDateTime);
    if (maxDate < new Date()) {
      throw new BadRequestException('Max reach date cannot be in the past');
    }
    if (maxDate <= depDate) {
      throw new BadRequestException('Max reach date must be after departure date');
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
        departureDateTime: new Date(dto.departureDateTime),
        maxReachDateTime: new Date(dto.maxReachDateTime),
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

  async search(dto: SearchTransportDto) {
    const now = new Date();
    const where: any = {
      status: TransportStatus.ACTIVE,
      maxReachDateTime: { gte: now },
    };

    if (dto.departureCity) where.departureCity = { contains: dto.departureCity.trim(), mode: 'insensitive' };
    if (dto.departureCountry) where.departureCountry = { contains: dto.departureCountry.trim(), mode: 'insensitive' };
    if (dto.destinationCity) where.destinationCity = { contains: dto.destinationCity.trim(), mode: 'insensitive' };
    if (dto.destinationCountry) where.destinationCountry = { contains: dto.destinationCountry.trim(), mode: 'insensitive' };
    if (dto.transportType) where.transportType = dto.transportType;
    if (dto.date) {
      const d = new Date(dto.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.departureDateTime = { gte: d, lt: next };
    }

    const transports = await this.prisma.transport.findMany({
      where,
      include: {
        transporter: { select: { id: true, name: true, phoneNumber: true, profileImageUrl: true, avatarUrl: true, profile: { select: { companyName: true } } } },
        vehicle: { select: { id: true, name: true, model: true, transportType: true, plateNumber: true, imageUrl: true } },
        stops: { orderBy: { stopOrder: 'asc' } },
      },
      orderBy: { departureDateTime: 'asc' },
    });

    return Promise.all(
      transports.map(async (transport: any) => {
        const stats = await this.getTransporterStats(transport.transporterId);
        return {
          ...transport,
          transporter: {
            ...transport.transporter,
            name: transport.transporter.profile?.companyName || transport.transporter.name,
            profileImageUrl: await this.storageService.resolveImageUrl(transport.transporter.profileImageUrl || transport.transporter.avatarUrl),
            ...stats,
          },
          vehicle: transport.vehicle
            ? {
                ...transport.vehicle,
                imageUrl: await this.storageService.resolveImageUrl(transport.vehicle.imageUrl),
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
        transporter: { select: { id: true, name: true, phoneNumber: true, profileImageUrl: true, avatarUrl: true, profile: { select: { companyName: true } } } },
        vehicle: { select: { id: true, name: true, model: true, transportType: true, plateNumber: true, imageUrl: true } },
        stops: { orderBy: { stopOrder: 'asc' } },
      },
    });
    if (!transport) throw new NotFoundException('Transport not found');

    const stats = await this.getTransporterStats(transport.transporterId);

    return {
      ...transport,
      transporter: {
        ...transport.transporter,
        name: transport.transporter.profile?.companyName || transport.transporter.name,
        profileImageUrl: await this.storageService.resolveImageUrl(transport.transporter.profileImageUrl),
        ...stats,
      },
      vehicle: transport.vehicle
        ? {
            ...transport.vehicle,
            imageUrl: await this.storageService.resolveImageUrl(transport.vehicle.imageUrl),
          }
        : null,
    };
  }

  async myRoutes(transporterId: string) {
    const transports = await this.prisma.transport.findMany({
      where: { transporterId },
      include: { vehicle: true, stops: { orderBy: { stopOrder: 'asc' } }, _count: { select: { bookings: true } } },
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
              imageUrl: await this.storageService.resolveImageUrl(transport.vehicle.imageUrl),
            }
          : null,
      })),
    );
  }

  async update(id: string, transporterId: string, dto: Partial<CreateTransportDto>) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId) throw new ForbiddenException();

    let transportType: typeof transport.transportType | undefined;
    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle || vehicle.transporterId !== transporterId) throw new ForbiddenException('Invalid vehicle');
      transportType = vehicle.transportType;
    }

    const finalDepDate = dto.departureDateTime ? new Date(dto.departureDateTime) : new Date(transport.departureDateTime);
    const finalMaxDate = dto.maxReachDateTime ? new Date(dto.maxReachDateTime) : new Date(transport.maxReachDateTime);

    if (dto.departureDateTime && finalDepDate < new Date()) {
      throw new BadRequestException('Departure date cannot be in the past');
    }
    if (dto.maxReachDateTime && finalMaxDate < new Date()) {
      throw new BadRequestException('Max reach date cannot be in the past');
    }
    if (finalMaxDate <= finalDepDate) {
      throw new BadRequestException('Max reach date must be after departure date');
    }

    const updateData: any = {
      ...dto,
      transportType,
      departureDateTime: dto.departureDateTime ? new Date(dto.departureDateTime) : undefined,
      maxReachDateTime: dto.maxReachDateTime ? new Date(dto.maxReachDateTime) : undefined,
    };

    if (dto.departureCountry) updateData.departureCountry = dto.departureCountry.trim();
    if (dto.departureCity) updateData.departureCity = dto.departureCity.trim();
    if (dto.departureAddress) updateData.departureAddress = dto.departureAddress.trim();
    if (dto.destinationCountry) updateData.destinationCountry = dto.destinationCountry.trim();
    if (dto.destinationCity) updateData.destinationCity = dto.destinationCity.trim();
    if (dto.destinationAddress) updateData.destinationAddress = dto.destinationAddress.trim();

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

  async remove(id: string, transporterId: string) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');
    if (transport.transporterId !== transporterId) throw new ForbiddenException();
    return this.prisma.transport.delete({ where: { id } });
  }

  async deleteByVehicle(vehicleId: string, transporterId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException();

    return this.prisma.transport.updateMany({
      where: { vehicleId },
      data: { status: TransportStatus.INACTIVE },
    });
  }
}
