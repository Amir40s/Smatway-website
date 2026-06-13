import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateAnnouncementDto,
  CreateAdminAnnouncementDto,
} from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(transporterId: string, dto: CreateAnnouncementDto) {
    if (dto.transportId) {
      const transport = await this.prisma.transport.findUnique({
        where: { id: dto.transportId },
      });
      if (!transport) {
        throw new NotFoundException('Target route not found');
      }
      if (transport.transporterId !== transporterId) {
        throw new ForbiddenException('You do not own this route');
      }
    }

    return this.prisma.announcement.create({
      data: {
        transporterId,
        transportId: dto.transportId || null,
        title: dto.title,
        content: dto.content,
        targetAudience: 'TRAVELER',
      },
      include: {
        transport: true,
      },
    });
  }

  async myAnnouncements(transporterId: string) {
    return this.prisma.announcement.findMany({
      where: { transporterId },
      include: {
        transport: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async travelerAnnouncements(travelerId: string) {
    // 1. Fetch traveler's bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        travelerId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'COMPLETED'],
        },
      },
      include: {
        transport: true,
      },
    });

    const transporterIds = Array.from(
      new Set(bookings.map((b) => b.transport.transporterId)),
    );
    const transportIds = Array.from(
      new Set(bookings.map((b) => b.transportId)),
    );

    // 2. Query announcements: pulls relevant admin system-wide or targeted announcements alongside regular transporter ones
    const announcements = await this.prisma.announcement.findMany({
      where: {
        OR: [
          // Transporter announcements related to bookings
          {
            transporterId: {
              in: transporterIds,
            },
            OR: [
              { transportId: null },
              {
                transportId: {
                  in: transportIds,
                },
              },
            ],
          },
          // Admin announcements targeted to TRAVELER or ALL
          {
            transporterId: null,
            targetAudience: {
              in: ['ALL', 'TRAVELER'],
            },
          },
        ],
      },
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            profile: { select: { companyName: true } },
          },
        },
        transport: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return announcements.map((ann: any) => ({
      ...ann,
      transporter: ann.transporter
        ? {
            ...ann.transporter,
            name: ann.transporter.profile?.companyName || ann.transporter.name,
          }
        : {
            name: 'SmatWay Administrator',
          },
    }));
  }

  async transporterAnnouncementsFeed() {
    return this.prisma.announcement.findMany({
      where: {
        transporterId: null,
        targetAudience: {
          in: ['ALL', 'TRANSPORTER'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAdminAnnouncement(dto: CreateAdminAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        targetAudience: dto.targetAudience,
      },
    });
  }

  async getAllAnnouncementsAdmin() {
    const announcements = await this.prisma.announcement.findMany({
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
        transport: {
          include: {
            vehicle: {
              select: {
                name: true,
                model: true,
                plateNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return announcements.map((ann: any) => {
      const transporterName =
        ann.transporter?.profile?.companyName || ann.transporter?.name || null;
      const fleet = ann.transport?.vehicle
        ? `${ann.transport.vehicle.name} (${ann.transport.vehicle.model}) [${ann.transport.vehicle.plateNumber}]`
        : null;
      const route = ann.transport
        ? `${ann.transport.departureCity} → ${ann.transport.destinationCity}`
        : null;

      return {
        ...ann,
        transporterName,
        fleet,
        route,
      };
    });
  }

  async removeAdmin(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  async remove(id: string, transporterId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.transporterId !== transporterId) {
      throw new ForbiddenException('You do not own this announcement');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
