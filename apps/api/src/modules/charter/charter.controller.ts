import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CharterService } from './charter.service';
import { UpsertCharterDto } from './dto/upsert-charter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('charter')
export class CharterController {
  constructor(private readonly charterService: CharterService) {}

  @Post('me')
  @UseInterceptors(
    FilesInterceptor('images', 10, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  upsert(
    @CurrentUser() user: User,
    @Body() dto: UpsertCharterDto,
    @UploadedFiles()
    images?: Express.Multer.File[],
  ) {
    if (user.accountType !== 'TRANSPORTER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only transporters can register charter services');
    }
    return this.charterService.upsertCharter(user.id, dto, images);
  }

  @Get('me')
  getMyCharter(@CurrentUser() user: User) {
    return this.charterService.getMyCharter(user.id);
  }

  @Post('request')
  async requestCharter(
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.charterService.submitCharterRequest(user.email, body);
  }

  @Get('admin/all')
  getAllCharters(@CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access all charter services');
    }
    return this.charterService.getAllCharters();
  }
}
