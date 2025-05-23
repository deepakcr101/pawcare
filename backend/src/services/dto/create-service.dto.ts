// backend/src/services/dto/create-service.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsEnum, Min, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client'; // Import ServiceType enum from Prisma client

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceType) // Validate against your Prisma ServiceType enum
  @IsNotEmpty()
  type!: ServiceType; // Assuming 'type' is non-nullable in your Service model

  @IsNumber()
  @Min(0) // Duration cannot be negative
  @Type(() => Number) // Ensure it's converted to a number
  durationMinutes!: number; // Assuming 'durationMinutes' is non-nullable

  @IsDecimal({ decimal_digits: '2' }) // Ensures it's a decimal with 2 digits
  @IsNotEmpty()
  @Type(() => String) // Important: Prisma often expects Decimal from string or BigInt
  price!: string; // Represent as string to avoid floating point issues and match Prisma's Decimal type

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
