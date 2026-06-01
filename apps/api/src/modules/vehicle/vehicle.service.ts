import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransportStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(transporterId: string, dto: CreateVehicleDto, imageFile?: Express.Multer.File) {
    let imageUrl: string | undefined;

    if (imageFile) {
      const result = await this.storageService.uploadFile(
        imageFile,
        `vehicles/${transporterId}`,
      );
      imageUrl = result.filePath;
    }

    return this.prisma.vehicle.create({
      data: {
        transporterId,
        name: dto.name,
        model: dto.model,
        plateNumber: dto.plateNumber,
        transportType: dto.transportType,
        imageUrl,
      },
    });
  }

  async myVehicles(transporterId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { transporterId, deleted: false },
      include: { _count: { select: { transports: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      vehicles.map(async (v) => {
        if (!v.imageUrl) return v;
        return { ...v, imageUrl: await this.storageService.resolveImageUrl(v.imageUrl) };
      }),
    );
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { transporter: { select: { id: true, name: true } } },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async remove(id: string, transporterId: string, reason?: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException();

    const activeRoutes = await this.prisma.transport.count({
      where: { vehicleId: id, status: TransportStatus.ACTIVE },
    });
    if (activeRoutes > 0) {
      throw new ForbiddenException('Cannot delete vehicle with active routes. Delete routes first.');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { deleteRequested: true, deleteReason: reason },
    });
  }

  async approveDelete(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return this.prisma.vehicle.update({
      where: { id },
      data: { deleted: true, deleteRequested: false },
    });
  }

  async rejectDelete(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return this.prisma.vehicle.update({
      where: { id },
      data: { deleteRequested: false },
    });
  }

  async update(id: string, transporterId: string, dto: Partial<CreateVehicleDto>, imageFile?: Express.Multer.File) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException();

    let imageUrl = vehicle.imageUrl;
    if (imageFile) {
      const result = await this.storageService.uploadFile(
        imageFile,
        `vehicles/${transporterId}`,
      );
      imageUrl = result.filePath;
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: dto.name,
        model: dto.model,
        plateNumber: dto.plateNumber,
        transportType: dto.transportType,
        imageUrl,
      },
    });
  }

  async getWithPresignedUrl(id: string) {
    const vehicle = await this.findOne(id);
    if (!vehicle.imageUrl) return vehicle;

    return {
      ...vehicle,
      imageUrl: await this.storageService.resolveImageUrl(vehicle.imageUrl),
    };
  }

  async getAllVehicles() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { deleted: false },
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            profile: { select: { companyName: true } },
          },
        },
        transports: {
          select: {
            id: true,
            departureCity: true,
            destinationCity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      vehicles.map(async (v) => {
        let imageUrl = v.imageUrl;
        if (imageUrl) {
          imageUrl = await this.storageService.resolveImageUrl(imageUrl);
        }
        return {
          ...v,
          imageUrl,
        };
      }),
    );
  }
}
