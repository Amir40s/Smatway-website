import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { StorageService } from '../../common/services/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

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
        createdAt: true,
        profile: {
          select: {
            companyName: true,
            licenseNumber: true,
            licenseExpiry: true,
            vehicleType: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountHolderName: true,
          },
        },
      },
    });

    return Promise.all(
      transporters.map(async (t) => {
        const avatarUrl = await this.storageService.resolveImageUrl(t.avatarUrl);
        return {
          ...t,
          avatarUrl,
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
    const totalUsers = await this.prisma.user.count();

    const activeBookings = await this.prisma.booking.count({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const revenueBookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
      },
      select: {
        totalPrice: true,
      },
    });

    const totalRevenue = revenueBookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice), 0);

    const supportTickets = await this.prisma.siteFeedback.count();

    // Fetch recent registrations
    const recentUsers = await this.prisma.user.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    });

    // Fetch recent bookings
    const recentBookings = await this.prisma.booking.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: { id: true, totalPrice: true, status: true, createdAt: true },
    });

    const activities = [
      ...recentUsers.map(u => ({
        type: 'user_registration',
        title: 'New user registration',
        description: `User ID: ${u.id.slice(0, 8).toUpperCase()} (${u.name || 'Anonymous'})`,
        time: u.createdAt,
      })),
      ...recentBookings.map(b => ({
        type: 'booking_created',
        title: `Booking ${b.status.toLowerCase()}`,
        description: `Booking ID: ${b.id.slice(0, 8).toUpperCase()} (Amount: $${Number(b.totalPrice).toFixed(2)})`,
        time: b.createdAt,
      })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

    return {
      totalUsers,
      activeBookings,
      totalRevenue,
      supportTickets,
      activities,
    };
  }
}
