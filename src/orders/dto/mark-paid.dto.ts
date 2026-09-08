import { IsOptional, IsString } from 'class-validator';

export class MarkPaidDto {
  @IsOptional()
  @IsString()
  reference?: string; // e.g. M-Pesa confirmation code

  @IsOptional()
  @IsString()
  method?: string; // defaults to "mpesa"
}
