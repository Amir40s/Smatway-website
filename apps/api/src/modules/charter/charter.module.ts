import { Module } from '@nestjs/common';
import { CharterController } from './charter.controller';
import { CharterService } from './charter.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { MailModule } from '../auth/mail/mail.module';

@Module({
  imports: [DatabaseModule, StorageModule, MailModule],
  controllers: [CharterController],
  providers: [CharterService],
})
export class CharterModule {}
