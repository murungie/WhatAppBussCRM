import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class AddRecipientsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  customerIds: string[];
}