import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [TransportController],
  providers: [TransportService],
})
export class TransportModule {}
