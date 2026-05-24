import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
