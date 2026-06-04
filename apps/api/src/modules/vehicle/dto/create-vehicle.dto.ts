import { IsEnum, IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { TransportType } from '@prisma/client';

export class CreateVehicleDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() model!: string;
  @IsString() @IsNotEmpty() plateNumber!: string;
  @IsEnum(TransportType) transportType!: TransportType;
  @IsOptional() features?: string | string[];
}
