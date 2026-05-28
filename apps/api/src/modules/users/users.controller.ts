import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type Multer from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { StorageService } from '../../common/services/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('transporters')
  async getTransporters(@CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access transporters details');
    }
    return this.usersService.getAllTransporters();
  }

  @Get('admin/stats')
  async getAdminStats(@CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access SmatWay dashboard stats');
    }
    return this.usersService.getAdminStats();
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('profile/upload-avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG and PNG files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    const { filePath, presignedUrl } = await this.storageService.uploadFile(file, `avatars/${user.id}`);

    // Store file path in database, return presigned URL
    await this.usersService.updateProfileAvatarPath(user.id, filePath);

    return { avatarUrl: presignedUrl };
  }

  @Post('emergency-contacts')
  async createEmergencyContact(
    @CurrentUser() user: User,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.usersService.createEmergencyContact(user.id, dto);
  }

  @Put('emergency-contacts/:id')
  async updateEmergencyContact(
    @Param('id') contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.usersService.updateEmergencyContact(contactId, dto);
  }

  @Delete('emergency-contacts/:id')
  @HttpCode(200)
  async deleteEmergencyContact(@Param('id') contactId: string) {
    return this.usersService.deleteEmergencyContact(contactId);
  }

  @Get('notification-preferences')
  async getNotificationPreferences(@CurrentUser() user: User) {
    return this.usersService.getNotificationPreferences(user.id);
  }

  @Put('notification-preferences')
  async updateNotificationPreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, dto);
  }

  @Put('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }
}
