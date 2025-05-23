import { IsString, IsNotEmpty, IsDateString, IsOptional, IsJSON } from 'class-validator';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  species!: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth!: string; // Using string for easy input via DTO, convert to Date in service

  @IsOptional()
  @IsJSON() // Validate as JSON string
  medicalHistory?: string; // Will store as JSONB in DB, received as string

  @IsOptional()
  @IsJSON() // Validate as JSON string
  vaccinationHistory?: string; // Will store as JSONB in DB, received as string

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

