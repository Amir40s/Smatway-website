import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN';

  @IsOptional()
  @IsIn(['TRAVELER', 'TRANSPORTER'])
  accountType?: 'TRAVELER' | 'TRANSPORTER';

  @IsOptional()
  @IsString()
  deletedAt?: string;

  @IsOptional()
  suspended?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  suspensionReason?: string;
}
