import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAutoReplyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  keyword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4096)
  response: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}