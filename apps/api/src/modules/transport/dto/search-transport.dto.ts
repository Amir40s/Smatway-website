import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransportType } from '@prisma/client';

export class SearchTransportDto {
  @IsOptional() @IsString() departureCity?: string;
  @IsOptional() @IsString() departureCountry?: string;
  @IsOptional() @IsString() destinationCity?: string;
  @IsOptional() @IsString() destinationCountry?: string;
  @IsOptional() @IsEnum(TransportType) transportType?: TransportType;
  @IsOptional() @IsString() date?: string;
}
