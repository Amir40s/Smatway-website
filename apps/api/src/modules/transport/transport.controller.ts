import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { SearchTransportDto } from './dto/search-transport.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTransportDto) {
    return this.transportService.create(user.id, dto);
  }

  @Get()
  search(@Query() dto: SearchTransportDto) {
    return this.transportService.search(dto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  getAllTransports(@CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access all routes');
    }
    return this.transportService.getAllTransports();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myRoutes(@CurrentUser() user: User) {
    return this.transportService.myRoutes(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: Partial<CreateTransportDto>) {
    return this.transportService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User, @Body() body?: { reason?: string }) {
    return this.transportService.remove(id, user.id, body?.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/:id/approve-delete')
  approveDelete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can approve deletion requests');
    }
    return this.transportService.approveDelete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/:id/reject-delete')
  rejectDelete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can reject deletion requests');
    }
    return this.transportService.rejectDelete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('vehicle/:vehicleId')
  deleteByVehicle(@Param('vehicleId') vehicleId: string, @CurrentUser() user: User) {
    return this.transportService.deleteByVehicle(vehicleId, user.id);
  }
}
