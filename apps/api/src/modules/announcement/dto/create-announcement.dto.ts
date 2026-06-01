import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  transportId?: string;
}

export class CreateAdminAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['ALL', 'TRAVELER', 'TRANSPORTER'])
  targetAudience!: 'ALL' | 'TRAVELER' | 'TRANSPORTER';
}
