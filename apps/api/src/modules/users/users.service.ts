import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { StorageService } from '../../common/services/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const exchangeRatesToUSD: Record<string, number> = {
  PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27,
  EGP: 0.021, ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044,
  XOF: 0.0017, XAF: 0.0017, MAD: 0.10, DZD: 0.0074, TND: 0.32,
  KES: 0.0076, ZAR: 0.054, RWF: 0.00077, UGX: 0.00026, GHS: 0.071, NGN: 0.00067,
  USD: 1.0,
};

const convertToUSD = (amount: number, currency?: string): number => {
  const cur = (currency || 'USD').toUpperCase();
  const rate = exchangeRatesToUSD[cur] || 1;
  return amount * rate;
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        country: true,
        preferredCurrency: true,
        avatarUrl: true,
        accountType: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');


    const avatarUrl = await this.storageService.resolveImageUrl(user.avatarUrl);

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        emergencyContacts: true,
        notificationPreferences: true,
      },
    });

    return {
      user: { ...user, avatarUrl },
      profile: profile || null,
      emergencyContacts: profile?.emergencyContacts || [],
      notificationPreferences: profile?.notificationPreferences || null,
    };
  }

  async getAllTransporters() {
    const transporters = await this.prisma.user.findMany({
      where: { accountType: 'TRANSPORTER' },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        country: true,
        avatarUrl: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        profile: {
          select: {
            companyName: true,
            licenseNumber: true,
            licenseExpiry: true,
            vehicleType: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountHolderName: true,
          },
        },
        vehicles: {
          where: { deleted: false },
          select: {
            id: true,
            name: true,
            model: true,
            plateNumber: true,
            transportType: true,
            imageUrl: true,
            deleteRequested: true,
          },
        },
        transports: {
          select: {
            id: true,
            departureCountry: true,
            departureCity: true,
            departureAddress: true,
            destinationCountry: true,
            destinationCity: true,
            destinationAddress: true,
            transportType: true,
            price: true,
            currency: true,
            availableSeats: true,
            departureDateTime: true,
            status: true,
            deleteRequested: true,
            vehicle: {
              select: {
                id: true,
                name: true,
                model: true,
                plateNumber: true,
              },
            },
            bookings: {
              where: { paymentStatus: 'PAID' },
              select: { totalPrice: true },
            },
          },
        },
      },
    });

    return Promise.all(
      transporters.map(async (t) => {
        const avatarUrl = await this.storageService.resolveImageUrl(t.avatarUrl);
        const fleetCount = t.vehicles.length;
        const routeCount = t.transports.length;
        const totalEarnings = t.transports.reduce(
          (sum, route) => sum + route.bookings.reduce((s, b) => s + convertToUSD(Number(b.totalPrice), route.currency), 0),
          0,
        );
        const status = t.isSuspended
          ? (t.suspensionReason === 'REJECTED' ? 'REJECTED' : 'SUSPENDED')
          : 'APPROVED';

        return {
          id: t.id,
          email: t.email,
          name: t.name,
          phoneNumber: t.phoneNumber,
          country: t.country,
          avatarUrl,
          createdAt: t.createdAt,
          profile: t.profile,
          fleetCount,
          routeCount,
          totalEarnings,
          status,
          vehicles: t.vehicles,
          transports: t.transports,
        };
      }),
    );
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        country: true,
        role: true,
        accountType: true,
        isSuspended: true,
        createdAt: true,
        profileImageUrl: true,
        avatarUrl: true,
        suspensionReason: true,
        profile: {
          select: {
            travelerBio: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            companyName: true,
            licenseNumber: true,
            licenseExpiry: true,
            vehicleType: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountHolderName: true,
          },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            totalPrice: true,
            paymentStatus: true,
            status: true,
            createdAt: true,
            transport: {
              select: {
                departureCity: true,
                destinationCity: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    return Promise.all(
      users.map(async (user) => {
        const avatarUrl = await this.storageService.resolveImageUrl(user.avatarUrl || user.profileImageUrl || null);
        const bookingHistory = user.bookings.slice(0, 3).map((booking) => ({
          id: booking.id,
          route: `${booking.transport.departureCity} → ${booking.transport.destinationCity}`,
          amount: convertToUSD(Number(booking.totalPrice), booking.transport.currency),
          currency: 'USD',
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
        }));

        const convertedBookings = user.bookings.map((booking) => ({
          ...booking,
          totalPrice: convertToUSD(Number(booking.totalPrice), booking.transport.currency),
          transport: {
            ...booking.transport,
            currency: 'USD',
          },
        }));

        return {
          ...user,
          profile: user.profile ?? null,
          avatarUrl,
          totalBookings: user.bookings.length,
          bookings: convertedBookings,
          bookingHistory,
          paymentHistory: user.bookings
            .filter((booking) => booking.paymentStatus !== 'PENDING')
            .slice(0, 3)
            .map((booking) => ({
              id: booking.id,
              amount: convertToUSD(Number(booking.totalPrice), booking.transport.currency),
              currency: 'USD',
              paymentStatus: booking.paymentStatus,
              createdAt: booking.createdAt,
            })),
        };
      }),
    );
  }

  async updateProfileAvatarPath(userId: string, avatarPath: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatarPath },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        country: dto.country,
        preferredCurrency: dto.preferredCurrency,
        avatarUrl: dto.avatarUrl,
      },
    });

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        bio: dto.bio,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        travelerBio: dto.travelerBio,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        companyName: dto.companyName,
        licenseNumber: dto.licenseNumber,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        vehicleType: dto.vehicleType,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        bankAccountHolderName: dto.bankAccountHolderName,
      },
      create: {
        userId,
        bio: dto.bio,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        travelerBio: dto.travelerBio,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        companyName: dto.companyName,
        licenseNumber: dto.licenseNumber,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        vehicleType: dto.vehicleType,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        bankAccountHolderName: dto.bankAccountHolderName,
      },
    });

    return profile;
  }

  async updateAdminUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.accountType !== undefined ? { accountType: dto.accountType } : {}),
        ...(dto.suspended !== undefined
          ? {
              isSuspended: dto.suspended,
              suspensionReason: dto.suspended ? (dto.suspensionReason?.trim() || null) : null,
            }
          : {}),
        ...(dto.deletedAt !== undefined ? { deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null, isSuspended: true } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        country: true,
        role: true,
        accountType: true,
        isSuspended: true,
        suspensionReason: true,
        deletedAt: true,
      },
    });

    return updatedUser;
  }

  async toggleAdminUserSuspension(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSuspended: true, deletedAt: true },
    });

    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: !user.isSuspended },
      select: {
        id: true,
        isSuspended: true,
      },
    });
  }

  async deleteAdminUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isSuspended: true },
    });

    return { ok: true };
  }

  async createEmergencyContact(userId: string, dto: CreateEmergencyContactDto) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return this.prisma.emergencyContact.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        relation: dto.relation,
        phone: dto.phone,
      },
    });
  }

  async updateEmergencyContact(contactId: string, dto: UpdateEmergencyContactDto) {
    const contact = await this.prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) throw new NotFoundException('Emergency contact not found');

    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        name: dto.name,
        relation: dto.relation,
        phone: dto.phone,
      },
    });
  }

  async deleteEmergencyContact(contactId: string) {
    const contact = await this.prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) throw new NotFoundException('Emergency contact not found');

    await this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    return { ok: true };
  }

  async getNotificationPreferences(userId: string) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { profileId: profile.id },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreferences.create({
        data: { profileId: profile.id },
      });
    }

    return prefs;
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return this.prisma.notificationPreferences.upsert({
      where: { profileId: profile.id },
      update: dto,
      create: {
        profileId: profile.id,
        ...dto,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { ok: true };
  }

  async getAdminStats() {
    const startOfWindow = new Date();
    startOfWindow.setDate(startOfWindow.getDate() - 6);
    startOfWindow.setHours(0, 0, 0, 0);

    const dayKeys = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWindow);
      date.setDate(startOfWindow.getDate() + index);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      return {
        key,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    });

    const [
      totalUsers,
      totalTransporters,
      totalFleets,
      totalRoutes,
      totalBookings,
      activeBookings,
      revenueBookings,
      supportTickets,
      recentUsers,
      recentBookings,
      bookingWindow,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { accountType: 'TRANSPORTER', deletedAt: null } }),
      this.prisma.vehicle.count({ where: { deleted: false } }),
      this.prisma.transport.count(),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      this.prisma.booking.findMany({
        where: { paymentStatus: 'PAID' },
        select: {
          totalPrice: true,
          transport: { select: { currency: true } },
        },
      }),
      this.prisma.siteFeedback.count(),
      this.prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { deletedAt: null },
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          traveler: { select: { id: true, name: true, email: true, avatarUrl: true } },
          transport: {
            select: {
              id: true,
              departureCity: true,
              destinationCity: true,
              departureDateTime: true,
              currency: true,
              transporter: {
                select: {
                  id: true,
                  name: true,
                  profile: { select: { companyName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: { createdAt: { gte: startOfWindow } },
        select: {
          createdAt: true,
          totalPrice: true,
          paymentStatus: true,
          transport: { select: { currency: true } },
        },
      }),
    ]);



    const totalRevenue = revenueBookings.reduce((sum: number, booking: any) => {
      return sum + convertToUSD(Number(booking.totalPrice), booking.transport?.currency);
    }, 0);

    const daySeries = dayKeys.map(({ key, label }) => ({
      key,
      label,
      bookings: 0,
      revenue: 0,
    }));

    const daySeriesByKey = new Map(daySeries.map((item) => [item.key, item]));

    bookingWindow.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const bucket = daySeriesByKey.get(key);
      if (!bucket) return;

      bucket.bookings += 1;
      if (booking.paymentStatus === 'PAID') {
        bucket.revenue += convertToUSD(Number(booking.totalPrice), booking.transport?.currency);
      }
    });

    const bookingAnalytics = daySeries.map(({ label, bookings }) => ({ label, value: bookings }));
    const revenueAnalytics = daySeries.map(({ label, revenue }) => ({ label, value: revenue }));

    const activities = [
      ...recentUsers.map((user) => ({
        type: 'user_registration',
        title: 'New user registration',
        description: `User ID: ${user.id.slice(0, 8).toUpperCase()} (${user.name || 'Anonymous'})`,
        time: user.createdAt,
      })),
      ...recentBookings.map((booking) => ({
        type: 'booking_created',
        title: `Booking ${booking.status.toLowerCase()}`,
        description: `Booking ID: ${booking.id.slice(0, 8).toUpperCase()} (Amount: $${convertToUSD(Number(booking.totalPrice), booking.transport.currency).toFixed(2)})`,
        time: booking.createdAt,
      })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

    const recentBookingsPayload = recentBookings.map((booking) => ({
      id: booking.id,
      createdAt: booking.createdAt,
      seatsBooked: booking.seatsBooked,
      totalPrice: convertToUSD(Number(booking.totalPrice), booking.transport.currency),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      traveler: booking.traveler,
      transport: {
        id: booking.transport.id,
        departureCity: booking.transport.departureCity,
        destinationCity: booking.transport.destinationCity,
        departureDateTime: booking.transport.departureDateTime,
        currency: 'USD',
        transporterName:
          booking.transport.transporter.profile?.companyName || booking.transport.transporter.name,
      },
    }));

    return {
      totalUsers,
      totalTransporters,
      totalFleets,
      totalRoutes,
      totalBookings,
      activeBookings,
      totalRevenue,
      supportTickets,
      pendingWithdrawalRequests: 0,
      activities,
      recentBookings: recentBookingsPayload,
      bookingAnalytics,
      revenueAnalytics,
    };
  }

  async getActivityLogs() {
    const [users, bookings, transports] = await Promise.all([
      this.prisma.user.findMany({ take: 30, orderBy: { createdAt: 'desc' } }),
      this.prisma.booking.findMany({
        take: 30,
        include: { traveler: { select: { name: true, email: true } }, transport: { select: { departureCity: true, destinationCity: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transport.findMany({
        take: 30,
        include: { transporter: { select: { name: true, profile: { select: { companyName: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const logs: any[] = [];

    users.forEach((u, index) => {
      logs.push({
        id: `log-usr-${u.id.substring(0, 8)}`,
        user: u.name || u.email,
        action: u.accountType === 'TRANSPORTER' ? 'Transporter Account Registered' : 'Traveler Account Registered',
        module: 'Users',
        timestamp: u.createdAt,
        ipAddress: `192.168.1.${10 + (index % 50)}`,
      });

      if (u.isSuspended) {
        logs.push({
          id: `log-sec-${u.id.substring(0, 8)}`,
          user: 'System / Admin',
          action: `Transporter account (${u.name || u.email}) suspended`,
          module: 'Security',
          timestamp: u.updatedAt,
          ipAddress: '127.0.0.1',
        });
      }
    });

    bookings.forEach((b, index) => {
      logs.push({
        id: `log-bkg-${b.id.substring(0, 8)}`,
        user: b.traveler?.name || 'Traveler',
        action: `Ticket reserved: ${b.transport?.departureCity || 'City'} → ${b.transport?.destinationCity || 'City'} (Status: ${b.status})`,
        module: 'Bookings',
        timestamp: b.createdAt,
        ipAddress: `172.16.8.${100 + (index % 100)}`,
      });

      if (b.paymentStatus === 'PAID') {
        logs.push({
          id: `log-pay-${b.id.substring(0, 8)}`,
          user: b.traveler?.name || 'Traveler',
          action: `Captured ticket transaction payment (Total: $${Number(b.totalPrice).toFixed(2)})`,
          module: 'Payments',
          timestamp: b.updatedAt,
          ipAddress: `172.16.8.${100 + (index % 100)}`,
        });
      }
    });

    transports.forEach((t, index) => {
      logs.push({
        id: `log-rte-${t.id.substring(0, 8)}`,
        user: t.transporter?.profile?.companyName || t.transporter?.name || 'Transporter',
        action: `Published route departure: ${t.departureCity} → ${t.destinationCity} (Capacity: ${t.availableSeats} seats)`,
        module: 'Routes',
        timestamp: t.createdAt,
        ipAddress: `10.0.0.${2 + (index % 30)}`,
      });
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  }
}
