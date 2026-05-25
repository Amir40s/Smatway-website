import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createReview(bookingId: string, travelerId: string, rating: number, feedback?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { transport: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.travelerId !== travelerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking must be completed before rating');
    }

    const existingReview = await this.prisma.review.findUnique({ where: { bookingId } });
    if (existingReview) throw new BadRequestException('Review already exists for this booking');

    return this.prisma.review.create({
      data: {
        bookingId,
        travelerId,
        transporterId: booking.transport.transporterId,
        rating,
        feedback: feedback?.trim(),
      },
    });
  }

  async getTransporterStats(transporterId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { transporterId },
    });

    const completedRides = await this.prisma.booking.count({
      where: {
        transport: { transporterId },
        status: BookingStatus.COMPLETED as any,
      },
    });

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    return {
      averageRating: avgRating,
      totalCompletedRides: completedRides,
      reviewCount: reviews.length,
    };
  }

  async getTransporterReviews(transporterId: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;

    const reviews = await this.prisma.review.findMany({
      where: { transporterId },
      include: {
        traveler: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.review.count({ where: { transporterId } });

    return {
      reviews,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Recent reviews across the platform — public, safe to expose.
   * Used by the marketing homepage Testimonials section.
   * Only returns reviews with a non-empty `feedback` string, so empty
   * star-only ratings don't render as blank quote bubbles.
   */
  async getRecentPlatformReviews(limit: number = 6) {
    const cappedLimit = Math.min(Math.max(limit, 1), 20);
    const reviews = await this.prisma.review.findMany({
      where: { feedback: { not: null } },
      include: {
        traveler: {
          select: {
            id: true,
            name: true,
            country: true,
            avatarUrl: true,
            profileImageUrl: true,
          },
        },
        transporter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: cappedLimit,
    });

    // Resolve each traveler's presigned avatar URL in parallel. Falls back
    // across profileImageUrl → avatarUrl. The frontend uses this to render
    // a real photo on the trip-receipt card; the gradient+initial chip stays
    // as the fallback when nothing is on file.
    const filtered = reviews.filter(
      (r) => r.feedback && r.feedback.trim().length > 0,
    );
    const withAvatars = await Promise.all(
      filtered.map(async (r) => {
        const rawAvatar = r.traveler.profileImageUrl || r.traveler.avatarUrl || null;
        const avatarUrl = rawAvatar
          ? await this.storageService.resolveImageUrl(rawAvatar).catch(() => null)
          : null;
        return {
          id: r.id,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt,
          traveler: {
            id: r.traveler.id,
            name: r.traveler.name,
            country: r.traveler.country,
            avatarUrl,
          },
          transporter: r.transporter,
        };
      }),
    );

    return { reviews: withAvatars };
  }

  async getTransporterFullProfile(transporterId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: transporterId },
      include: { profile: { select: { companyName: true } } },
    });

    if (!user) throw new NotFoundException('Transporter not found');

    const stats = await this.getTransporterStats(transporterId);
    const { reviews } = await this.getTransporterReviews(transporterId, 1, 5);

    const vehicleCount = await this.prisma.vehicle.count({
      where: { transporterId, deleted: false },
    });

    const profileImageUrl = await this.storageService.resolveImageUrl(user.profileImageUrl || user.avatarUrl);

    return {
      ...user,
      name: user.profile?.companyName || user.name,
      profileImageUrl,
      ...stats,
      vehicleCount,
      reviews,
    };
  }
}
