import {
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpsertCustomerDto {
  @Matches(/^\+?[0-9]{9,15}$/, {
    message:
      'phoneNumber must be a valid phone number',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  name?: string;
}