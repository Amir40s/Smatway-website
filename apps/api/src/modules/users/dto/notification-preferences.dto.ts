import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  bookingUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  routeUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  vehicleUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  systemAnnouncements?: boolean;
}
