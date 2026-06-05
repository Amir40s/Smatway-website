import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { ChatModule } from '../chat/chat.module';
import { MailModule } from '../auth/mail/mail.module';

@Module({
  imports: [DatabaseModule, StorageModule, ChatModule, MailModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
