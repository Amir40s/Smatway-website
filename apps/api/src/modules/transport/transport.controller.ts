import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
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
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.transportService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('vehicle/:vehicleId')
  deleteByVehicle(@Param('vehicleId') vehicleId: string, @CurrentUser() user: User) {
    return this.transportService.deleteByVehicle(vehicleId, user.id);
  }
}
