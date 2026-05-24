import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateEmergencyContactDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(family|friend|other)$/)
  relation!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone!: string;
}

export class UpdateEmergencyContactDto extends CreateEmergencyContactDto {}
