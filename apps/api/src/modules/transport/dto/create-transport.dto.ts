import { IsNotEmpty, IsNumber, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateTransportDto {
  @IsString() @IsNotEmpty() departureCountry!: string;
  @IsString() @IsNotEmpty() departureCity!: string;
  @IsString() @IsNotEmpty() destinationCountry!: string;
  @IsString() @IsNotEmpty() destinationCity!: string;

  @IsString() @IsNotEmpty() vehicleId!: string;

  @IsNumber() @Min(0) price!: number;

  // ISO 4217 currency code (e.g. "NGN", "GHS"). Optional — falls back to transporter's preferredCurrency or USD.
  @IsOptional() @IsString() @Length(3, 3) currency?: string;

  @IsInt() @Min(1) availableSeats!: number;

  @IsString() @IsNotEmpty() departureDateTime!: string;

  @IsString() @IsNotEmpty() maxReachDateTime!: string;
}
