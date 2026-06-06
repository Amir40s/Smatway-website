import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExcessLuggageService } from './excess-luggage.service';

@Controller('excess-luggage')
export class ExcessLuggageController {
  constructor(private readonly excessLuggageService: ExcessLuggageService) {}

  @Post(':bookingNumber')
  async createCharge(
    @Param('bookingNumber') bookingNumber: string,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.excessLuggageService.createCharge(bookingNumber, amount, description);
  }

  @Get(':bookingNumber')
  async getCharges(@Param('bookingNumber') bookingNumber: string) {
    return this.excessLuggageService.getChargesByBookingNumber(bookingNumber);
  }
}
