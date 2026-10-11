import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ConnectWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  phoneNumberId!: string;
}