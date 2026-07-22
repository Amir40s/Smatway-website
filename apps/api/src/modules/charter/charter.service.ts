import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { UpsertCharterDto } from './dto/upsert-charter.dto';
import { MailService } from '../auth/mail/mail.service';

@Injectable()
export class CharterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) {}

  async upsertCharter(
    transporterId: string,
    dto: UpsertCharterDto,
    imageFiles?: Express.Multer.File[],
  ) {
    let newPhotoUrls: string[] = [];

    // Upload new photos if provided
    if (imageFiles && imageFiles.length > 0) {
      const paths = await Promise.all(
        imageFiles.map(async (file) => {
          const result = await this.storageService.uploadFile(
            file,
            `charters/${transporterId}`,
          );
          return result.filePath;
        }),
      );
      newPhotoUrls = paths;
    }

    // Check if charter service already exists for this transporter
    const existing = await this.prisma.charterService.findUnique({
      where: { transporterId },
    });

    const combinedPhotos = existing
      ? [...(existing.vehiclePhotos || []), ...newPhotoUrls]
      : newPhotoUrls;

    // Normalize array fields — multipart/form-data sends a single value as a raw
    // string instead of a one-element array, so we always coerce them to arrays.
    const toArray = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean);
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const data = {
      transporterId,
      vehicleTypes: toArray(dto.vehicleTypes),
      capacity: dto.capacity || '',
      amenities: toArray(dto.amenities),
      operatingLocations: toArray(dto.operatingLocations),
      serviceTimes: dto.serviceTimes || '',
      charges: dto.charges || '',
      includesFuelAndMaintenance: String(dto.includesFuelAndMaintenance) === 'true',
      currency: dto.currency || 'USD',
      paymentTerms: dto.paymentTerms || '',
      maxKilometerCover: dto.maxKilometerCover || '',
      otherConditions: dto.otherConditions || '',
      vehiclePhotos: combinedPhotos,
    };

    const transporter = await this.prisma.user.findUnique({
      where: { id: transporterId },
      select: { email: true },
    });

    if (transporter) {
      await this.mailService.sendTransporterCharterOfferEmail(transporter.email, dto);
    }

    if (existing) {
      return this.prisma.charterService.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.charterService.create({
        data,
      });
    }
  }

  async getMyCharter(transporterId: string) {
    const charter = await this.prisma.charterService.findUnique({
      where: { transporterId },
    });
    
    if (charter && charter.vehiclePhotos?.length > 0) {
      charter.vehiclePhotos = await Promise.all(
        charter.vehiclePhotos.map((p: string) => this.storageService.resolveImageUrl(p)),
      ) as string[];
    }
    
    return charter;
  }

  async getAllCharters() {
    const charters = await this.prisma.charterService.findMany({
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            profile: {
              select: { companyName: true },
            },
          },
        },
      },
    });

    // Resolve images
    for (const charter of charters) {
      if (charter.vehiclePhotos?.length > 0) {
        charter.vehiclePhotos = await Promise.all(
          charter.vehiclePhotos.map((p: string) => this.storageService.resolveImageUrl(p)),
        ) as string[];
      }
    }

    return charters;
  }

  async submitCharterRequest(userEmail: string, data: any) {
    await this.mailService.sendCharterRequestEmail(userEmail, data);
    return { success: true };
  }
}
