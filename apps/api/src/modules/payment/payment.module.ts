import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MailModule } from '../auth/mail/mail.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [HttpModule, MailModule, ChatModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
