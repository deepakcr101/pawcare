// backend/src/staff/dto/update-staff.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';
import { IsOptional, IsString, IsEnum, IsUrl, IsMobilePhone, IsEmail, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password?: string; // Explicitly make optional and re-add decorators if needed

  @IsEmail()
  @IsOptional()
  email?: string; // Explicitly make optional

  @IsEnum(Role, { message: 'Role must be one of CLINIC_STAFF or GROOMER' })
  @IsOptional()
  role?: Role;
}