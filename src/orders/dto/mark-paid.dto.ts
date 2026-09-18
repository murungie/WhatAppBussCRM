import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPaidDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
