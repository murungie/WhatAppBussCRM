import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum BroadcastType {
  TEXT = 'TEXT',
  TEMPLATE = 'TEMPLATE',
}

export class CreateBroadcastDto {
  @IsOptional()
  @IsEnum(BroadcastType)
  type?: BroadcastType;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  templateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  templateLanguage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  templateParameters?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  segment?: string;
}