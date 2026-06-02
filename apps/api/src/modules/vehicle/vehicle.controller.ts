import {
  Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param,
  ParseFilePipe, Patch, Post, UploadedFiles, UseGuards, UseInterceptors, ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateVehicleDto,
    @UploadedFiles()
    images?: Express.Multer.File[],
  ) {
    return this.vehicleService.create(user.id, dto, images);
  }

  @Get('my')
  myVehicles(@CurrentUser() user: User) {
    return this.vehicleService.myVehicles(user.id);
  }

  @Get('admin/all')
  getAllVehicles(@CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access all vehicles');
    }
    return this.vehicleService.getAllVehicles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.getWithPresignedUrl(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateVehicleDto>,
    @UploadedFiles()
    images?: Express.Multer.File[],
  ) {
    return this.vehicleService.update(id, user.id, dto, images);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User, @Body() body?: { reason?: string }) {
    return this.vehicleService.remove(id, user.id, body?.reason);
  }

  @Post('admin/:id/approve-delete')
  approveDelete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can approve deletion requests');
    }
    return this.vehicleService.approveDelete(id);
  }

  @Post('admin/:id/reject-delete')
  rejectDelete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can reject deletion requests');
    }
    return this.vehicleService.rejectDelete(id);
  }
}
