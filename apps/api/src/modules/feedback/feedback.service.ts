import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { MailService } from '../auth/mail/mail.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, rating: number, comment: string, bookingId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.accountType !== 'TRAVELER') {
      throw new ForbiddenException('Only travelers can give feedback');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(
        'Rating must be an integer between 1 and 5',
      );
    }
    const trimmed = (comment || '').trim();
    if (trimmed.length < 4) {
      throw new BadRequestException('Comment must be at least 4 characters');
    }
    if (trimmed.length > 1000) {
      throw new BadRequestException('Comment must be 1000 characters or fewer');
    }
    return this.prisma.siteFeedback.create({
      data: { userId, rating, comment: trimmed, bookingId: bookingId || null },
      select: { id: true, rating: true, comment: true, createdAt: true, bookingId: true },
    });
  }

  /** Public — recent site feedback for the marketing homepage Testimonials rotator. */
  async getRecent(limit: number = 6) {
    const cappedLimit = Math.min(Math.max(limit, 1), 20);
    const items = await this.prisma.siteFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: cappedLimit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            country: true,
            accountType: true,
            avatarUrl: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Resolve presigned avatar URLs in parallel. Transporters typically have
    // a profileImageUrl; travelers use avatarUrl. Fall back across both.
    const resolved = await Promise.all(
      items.map(async (f) => {
        const rawAvatar = f.user.profileImageUrl || f.user.avatarUrl || null;
        const avatarUrl = rawAvatar
          ? await this.storageService.resolveImageUrl(rawAvatar).catch(() => null)
          : null;
        return {
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.createdAt,
          bookingId: f.bookingId,
          user: {
            id: f.user.id,
            name: f.user.name,
            country: f.user.country,
            accountType: f.user.accountType,
            avatarUrl,
          },
        };
      }),
    );

    return { feedback: resolved };
  }

  /**
   * Public — aggregate stats over all site feedback. Powers the homepage
   * Feedback section's big rating + rating distribution bars.
   */
  async getStats() {
    const all = await this.prisma.siteFeedback.findMany({
      select: { rating: true },
    });
    const count = all.length;
    if (count === 0) {
      return {
        count: 0,
        avgRating: null as number | null,
        distribution: [0, 0, 0, 0, 0], // 1..5 stars in pct
        recommendRate: null as number | null,
      };
    }
    const sum = all.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Math.round((sum / count) * 10) / 10;
    const buckets: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (const r of all) {
      const idx = Math.min(Math.max(r.rating, 1), 5) - 1;
      buckets[idx as 0 | 1 | 2 | 3 | 4] += 1;
    }
    const distribution = buckets.map((n) => Math.round((n / count) * 1000) / 10);
    const fourPlus = buckets[3] + buckets[4];
    const recommendRate = Math.round((fourPlus / count) * 1000) / 10;
    return { count, avgRating, distribution, recommendRate };
  }

  async listMine(userId: string) {
    const items = await this.prisma.siteFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });
    return { feedback: items };
  }

  /** Admin — full list of all site feedback with booking + transport + user details. */
  async getAllForAdmin() {
    const items = await this.prisma.siteFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            country: true,
            accountType: true,
            avatarUrl: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Fetch booking + transport details for each feedback that has a bookingId
    const enriched = await Promise.all(
      items.map(async (f) => {
        const rawAvatar = f.user.profileImageUrl || f.user.avatarUrl || null;
        const avatarUrl = rawAvatar
          ? await this.storageService.resolveImageUrl(rawAvatar).catch(() => null)
          : null;

        let booking: {
          id: string;
          status: string;
          seatsBooked: number;
          transport: { departureCity: string; destinationCity: string; departureCountry: string; destinationCountry: string; departureDateTime: Date } | null;
        } | null = null;

        if (f.bookingId) {
          const b = await this.prisma.booking.findUnique({
            where: { id: f.bookingId },
            select: {
              id: true,
              status: true,
              seatsBooked: true,
              transport: {
                select: {
                  departureCity: true,
                  destinationCity: true,
                  departureCountry: true,
                  destinationCountry: true,
                  departureDateTime: true,
                  transporter: {
                    select: {
                      id: true,
                      name: true,
                      profile: {
                        select: {
                          companyName: true,
                        },
                      },
                    },
                  },
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
          });
          booking = b ?? null;
        }

        return {
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.createdAt,
          bookingId: f.bookingId,
          user: {
            id: f.user.id,
            name: f.user.name,
            email: f.user.email,
            country: f.user.country,
            accountType: f.user.accountType,
            avatarUrl,
          },
          booking,
        };
      }),
    );

    return enriched;
  }

  async rateJourney(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      throw new BadRequestException('User email not found');
    }
    if (user.accountType !== 'TRAVELER') {
      throw new ForbiddenException('Only travelers can give feedback');
    }
    await this.mailService.sendJourneyFeedbackEmail(user.email, data);
    return { ok: true };
  }
}
