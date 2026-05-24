import {
  Body, Controller, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentMethod, User } from '@prisma/client';
import { IsEnum } from 'class-validator';

class UpdatePaymentDto {
  @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
}

@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingService.create(user.id, dto);
  }

  @Get('my')
  myBookings(@CurrentUser() user: User) {
    return this.bookingService.myBookings(user.id);
  }

  @Get('transporter/all')
  allTransporterBookings(@CurrentUser() user: User) {
    return this.bookingService.allTransporterBookings(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingService.findOne(id, user.id);
  }

  @Get('transport/:transportId')
  transportBookings(@Param('transportId') transportId: string, @CurrentUser() user: User) {
    return this.bookingService.transportBookings(transportId, user.id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingService.cancel(id, user.id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingService.confirm(id, user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingService.reject(id, user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingService.complete(id, user.id);
  }

  @Patch(':id/payment-method')
  updatePaymentMethod(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.bookingService.updatePaymentMethod(id, user.id, dto.paymentMethod);
  }
}
