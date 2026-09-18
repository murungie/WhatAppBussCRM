import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  businessName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  whatsappPhoneId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  whatsappToken?: string;
}
