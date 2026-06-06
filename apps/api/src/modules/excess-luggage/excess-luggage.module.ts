import { Module } from '@nestjs/common';
import { ExcessLuggageService } from './excess-luggage.service';
import { ExcessLuggageController } from './excess-luggage.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExcessLuggageController],
  providers: [ExcessLuggageService],
  exports: [ExcessLuggageService],
})
export class ExcessLuggageModule {}
