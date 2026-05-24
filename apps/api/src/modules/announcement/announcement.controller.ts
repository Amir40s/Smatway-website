import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, AccountType } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateAnnouncementDto) {
    if (user.accountType !== AccountType.TRANSPORTER) {
      throw new ForbiddenException('Only transporters can broadcast announcements');
    }
    return this.announcementService.create(user.id, dto);
  }

  @Get('transporter')
  myAnnouncements(@CurrentUser() user: User) {
    if (user.accountType !== AccountType.TRANSPORTER) {
      throw new ForbiddenException('Only transporters can view their published announcements');
    }
    return this.announcementService.myAnnouncements(user.id);
  }

  @Get('traveler')
  travelerAnnouncements(@CurrentUser() user: User) {
    if (user.accountType !== AccountType.TRAVELER) {
      throw new ForbiddenException('Only travelers can view their received announcements feed');
    }
    return this.announcementService.travelerAnnouncements(user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.accountType !== AccountType.TRANSPORTER) {
      throw new ForbiddenException('Only transporters can delete announcements');
    }
    return this.announcementService.remove(id, user.id);
  }
}
