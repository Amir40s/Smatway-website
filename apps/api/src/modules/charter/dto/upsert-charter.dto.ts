import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpsertCharterDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicleTypes?: string[];

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  operatingLocations?: string[];

  @IsString()
  @IsOptional()
  serviceTimes?: string;

  @IsString()
  @IsOptional()
  charges?: string;

  @IsOptional()
  includesFuelAndMaintenance?: any;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  maxKilometerCover?: string;

  @IsString()
  @IsOptional()
  otherConditions?: string;
}
