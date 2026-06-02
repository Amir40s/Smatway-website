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

  private async resolveImageUrls(imageUrl: string | null | undefined): Promise<string[]> {
    if (!imageUrl) return [];
    try {
      if (imageUrl.startsWith('[')) {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed)) {
          const resolved = await Promise.all(parsed.map(p => this.storageService.resolveImageUrl(p)));
          return resolved.filter((p): p is string => typeof p === 'string');
        }
      }
    } catch (e) {
      // Ignore
    }
    const paths = imageUrl.split(',').map(p => p.trim()).filter(Boolean);
    const resolved = await Promise.all(paths.map(p => this.storageService.resolveImageUrl(p)));
    return resolved.filter((p): p is string => typeof p === 'string');
  }

  async create(transporterId: string, dto: CreateVehicleDto, imageFiles?: Express.Multer.File[]) {
    let imageUrl: string | undefined;

    if (imageFiles && imageFiles.length > 0) {
      const paths = await Promise.all(
        imageFiles.map(async (file) => {
          const result = await this.storageService.uploadFile(
            file,
            `vehicles/${transporterId}`,
          );
          return result.filePath;
        })
      );
      imageUrl = JSON.stringify(paths);
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        transporterId,
        name: dto.name,
        model: dto.model,
        plateNumber: dto.plateNumber,
        transportType: dto.transportType,
        imageUrl,
      },
    });

    const urls = await this.resolveImageUrls(vehicle.imageUrl);
    return { ...vehicle, imageUrl: urls[0] || null, imageUrls: urls };
  }

  async myVehicles(transporterId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { transporterId, deleted: false },
      include: { _count: { select: { transports: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      vehicles.map(async (v) => {
        const urls = await this.resolveImageUrls(v.imageUrl);
        return { ...v, imageUrl: urls[0] || null, imageUrls: urls };
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

  async update(id: string, transporterId: string, dto: Partial<CreateVehicleDto>, imageFiles?: Express.Multer.File[]) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.transporterId !== transporterId) throw new ForbiddenException();

    let imageUrl = vehicle.imageUrl;
    if (imageFiles && imageFiles.length > 0) {
      const paths = await Promise.all(
        imageFiles.map(async (file) => {
          const result = await this.storageService.uploadFile(
            file,
            `vehicles/${transporterId}`,
          );
          return result.filePath;
        })
      );
      imageUrl = JSON.stringify(paths);
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        name: dto.name,
        model: dto.model,
        plateNumber: dto.plateNumber,
        transportType: dto.transportType,
        imageUrl,
      },
    });

    const urls = await this.resolveImageUrls(updated.imageUrl);
    return { ...updated, imageUrl: urls[0] || null, imageUrls: urls };
  }

  async getWithPresignedUrl(id: string) {
    const vehicle = await this.findOne(id);
    const urls = await this.resolveImageUrls(vehicle.imageUrl);
    return {
      ...vehicle,
      imageUrl: urls[0] || null,
      imageUrls: urls,
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
        const urls = await this.resolveImageUrls(v.imageUrl);
        return {
          ...v,
          imageUrl: urls[0] || null,
          imageUrls: urls,
        };
      }),
    );
  }
}
