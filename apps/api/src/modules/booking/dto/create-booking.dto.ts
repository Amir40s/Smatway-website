import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateBookingDto {
  @IsString() transportId!: string;
  @IsInt() @Min(1) seatsBooked!: number;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
}
