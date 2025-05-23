// backend/src/staff/dto/create-staff.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional, IsUrl, IsMobilePhone,ValidationOptions } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string; // Should be here

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string; // Should be here

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsMobilePhone('en-IN')
  @IsOptional()
  phone?: string;
  
  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(Role, { message: 'Role must be a valid staff role' })
  @IsNotEmpty()
  role!: Role;
}