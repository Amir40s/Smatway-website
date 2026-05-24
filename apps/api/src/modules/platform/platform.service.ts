import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BookingStatus, TransportStatus, TransportType } from '@prisma/client';

type PopularRoute = {
  from: string;
  to: string;
  fromCountry: string;
  toCountry: string;
  bookings: number;
  minPrice: number;
  currency: string;
  vehicle: string;
  nextDepartureMinutes: number | null;
  availableSeats: number;
};

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public, anonymised platform totals — safe to show on the marketing /
   * auth surfaces. All values are pulled live from the DB so the numbers are
   * always real, never inflated.
   */
  async getOverview(reviewLimit = 4) {
    const [
      travelers,
      transporters,
      activeRoutes,
      totalBookings,
      completedBookings,
      reviewCount,
      ratingAgg,
      recentReviewsRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { accountType: 'TRAVELER' } }),
      this.prisma.user.count({ where: { accountType: 'TRANSPORTER' } }),
      this.prisma.transport.count({
        where: { status: TransportStatus.ACTIVE },
      }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
      this.prisma.review.findMany({
        where: { feedback: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(reviewLimit, 10)),
        include: {
          traveler: { select: { name: true, country: true } },
          transporter: { select: { name: true } },
        },
      }),
    ]);

    const onTimeRate =
      completedBookings > 0
        ? Math.round((completedBookings / totalBookings) * 1000) / 10
        : null;

    return {
      stats: {
        travelers,
        transporters,
        activeRoutes,
        completedTrips: completedBookings,
        reviews: reviewCount,
        avgRating:
          ratingAgg._avg.rating !== null
            ? Math.round(Number(ratingAgg._avg.rating) * 10) / 10
            : null,
        onTimeRate,
      },
      recentReviews: recentReviewsRaw
        .filter((r) => r.feedback && r.feedback.trim().length > 0)
        .map((r) => ({
          id: r.id,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt,
          traveler: r.traveler,
          transporter: r.transporter,
        })),
    };
  }

  /**
   * Public — most popular intercity routes ranked by booking count.
   * Used by the marketing homepage PopularRoutes bento. Falls back to an
   * empty list when nothing matches; the frontend keeps its seed data.
   */
  async getPopularRoutes(
    limit: number = 4,
  ): Promise<{ routes: PopularRoute[] }> {
    const cappedLimit = Math.min(Math.max(limit, 1), 10);

    // Group transports by city pair, summing bookings across all transports
    // that share the same origin/destination. We aggregate in-memory after
    // pulling active transports because Prisma can't group across joins
    // ergonomically here.
    const transports = await this.prisma.transport.findMany({
      where: { status: TransportStatus.ACTIVE },
      include: {
        bookings: { select: { id: true } },
      },
    });

    const pairs = new Map<
      string,
      {
        from: string;
        to: string;
        fromCountry: string;
        toCountry: string;
        bookings: number;
        minPrice: number;
        currency: string;
        vehicleTypes: Set<string>;
        seats: number;
        nextDeparture: Date | null;
      }
    >();

    for (const t of transports) {
      const key = `${t.departureCountry}|${t.departureCity}->${t.destinationCountry}|${t.destinationCity}`;
      const existing = pairs.get(key);
      const price = Number(t.price);
      if (existing) {
        existing.bookings += t.bookings.length;
        existing.minPrice = Math.min(existing.minPrice, price);
        existing.vehicleTypes.add(prettyVehicle(t.transportType));
        existing.seats += t.availableSeats;
        if (t.departureDateTime > new Date()) {
          if (
            !existing.nextDeparture ||
            t.departureDateTime < existing.nextDeparture
          ) {
            existing.nextDeparture = t.departureDateTime;
          }
        }
      } else {
        pairs.set(key, {
          from: t.departureCity,
          to: t.destinationCity,
          fromCountry: t.departureCountry,
          toCountry: t.destinationCountry,
          bookings: t.bookings.length,
          minPrice: price,
          currency: t.currency,
          vehicleTypes: new Set([prettyVehicle(t.transportType)]),
          seats: t.availableSeats,
          nextDeparture:
            t.departureDateTime > new Date() ? t.departureDateTime : null,
        });
      }
    }

    const ranked = Array.from(pairs.values())
      .sort((a, b) => b.bookings - a.bookings || a.minPrice - b.minPrice)
      .slice(0, cappedLimit);

    const now = Date.now();
    return {
      routes: ranked.map((p) => ({
        from: p.from,
        to: p.to,
        fromCountry: p.fromCountry,
        toCountry: p.toCountry,
        bookings: p.bookings,
        minPrice: p.minPrice,
        currency: p.currency,
        vehicle: Array.from(p.vehicleTypes).join(' + '),
        availableSeats: p.seats,
        nextDepartureMinutes: p.nextDeparture
          ? Math.max(0, Math.round((p.nextDeparture.getTime() - now) / 60000))
          : null,
      })),
    };
  }
}

function prettyVehicle(type: TransportType): string {
  switch (type) {
    case TransportType.CAR:
      return 'Sedan';
    case TransportType.VAN:
      return 'Van';
    case TransportType.BUS:
      return 'Coach';
    case TransportType.MINIBUS:
      return 'Minibus';
    case TransportType.TRAIN:
      return 'Train';
    default:
      return 'Vehicle';
  }
}
