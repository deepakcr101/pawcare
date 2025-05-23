import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsString({ message: 'First name must be a string' })
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  lastName!: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsOptional() // Phone number is optional based on schema
  phone?: string;
}
