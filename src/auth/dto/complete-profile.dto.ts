import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  businessName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  businessPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}