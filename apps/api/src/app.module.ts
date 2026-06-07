import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './modules/cache/cache.module';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransportModule } from './modules/transport/transport.module';
import { BookingModule } from './modules/booking/booking.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ReviewModule } from './modules/review/review.module';
import { ChatModule } from './modules/chat/chat.module';
import { PlatformModule } from './modules/platform/platform.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ExcessLuggageModule } from './modules/excess-luggage/excess-luggage.module';
import { KillSwitchModule } from './modules/kill-switch/kill-switch.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TransportModule,
    BookingModule,
    VehicleModule,
    ReviewModule,
    ChatModule,
    PlatformModule,
    FeedbackModule,
    AnnouncementModule,
    PaymentModule,
    ExcessLuggageModule,
    KillSwitchModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule { }
