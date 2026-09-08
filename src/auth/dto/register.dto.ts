import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  businessName: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
