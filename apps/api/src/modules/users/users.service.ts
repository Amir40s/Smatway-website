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

    // Generate presigned URL if avatar exists
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
}
