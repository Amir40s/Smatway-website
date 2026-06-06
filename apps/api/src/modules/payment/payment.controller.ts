import { Body, Controller, Get, Headers, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  initializePayment(
    @CurrentUser() user: User,
    @Body('bookingId') bookingId: string,
    @Body('callbackUrl') callbackUrl?: string,
  ) {
    return this.paymentService.initializePayment(bookingId, user.id, callbackUrl);
  }

  @Post('initialize-excess-luggage')
  initializeExcessLuggagePayment(
    @Body('excessLuggageId') excessLuggageId: string,
    @Body('callbackUrl') callbackUrl?: string,
  ) {
    return this.paymentService.initializeExcessLuggagePayment(excessLuggageId, callbackUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:reference')
  verifyPayment(@CurrentUser() user: User, @Param('reference') reference: string) {
    return this.paymentService.verifyPayment(reference, user.id);
  }

  @Get('verify-excess-luggage/:reference')
  verifyExcessLuggagePayment(@Param('reference') reference: string) {
    return this.paymentService.verifyExcessLuggagePayment(reference);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Headers('x-paystack-signature') signature: string, @Req() req: any) {
    // Note: To properly verify Paystack webhook signature, the body must be raw string.
    // Ensure Express raw-body parser is used if verifying webhook securely.
    // For now, we pass the parsed body to the handler.
    this.paymentService.handleWebhook(signature, req.body);
    return { received: true };
  }

  @Post('webhook/flutterwave')
  @HttpCode(200)
  handleFlutterwaveWebhook(@Headers('verif-hash') signature: string, @Req() req: any) {
    this.paymentService.handleFlutterwaveWebhook(signature, req.body);
    return { received: true };
  }
}
