import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExcessLuggageService } from './excess-luggage.service';

@Controller('excess-luggage')
export class ExcessLuggageController {
  constructor(private readonly excessLuggageService: ExcessLuggageService) {}

  @Post(':bookingId')
  async createCharge(
    @Param('bookingId') bookingId: string,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.excessLuggageService.createCharge(
      bookingId,
      amount,
      description,
    );
  }

  @Get('charge/:id')
  async getChargeById(@Param('id') id: string) {
    return this.excessLuggageService.getChargeById(id);
  }

  @Get(':bookingId')
  async getCharges(@Param('bookingId') bookingId: string) {
    return this.excessLuggageService.getChargesByBookingId(bookingId);
  }
}
