import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

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

    if (bookings.length === 0) {
      return [];
    }

    // 2. Extract unique transporter IDs and transport IDs
    const transporterIds = Array.from(new Set(bookings.map((b) => b.transport.transporterId)));
    const transportIds = Array.from(new Set(bookings.map((b) => b.transportId)));

    // 3. Query announcements
    return this.prisma.announcement.findMany({
      where: {
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
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        transport: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
