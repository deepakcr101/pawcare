// backend/src/pets/dto/create-pet.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsJSON } from 'class-validator';
import { PetGender, PetSpecies } from '@prisma/client'; // Assuming you might have enums

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PetSpecies)
  @IsNotEmpty()
  species: PetSpecies;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(PetGender)
  @IsOptional()
  gender?: PetGender;

  @IsDateString() // Ensures it's a date string like YYYY-MM-DD
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsJSON() // If medicalHistory is expected as a JSON string
  @IsOptional()
  medicalHistory?: string; // Or any, if you parse later in service

  @IsJSON() // If vaccinationHistory is expected as a JSON string
  @IsOptional()
  vaccinationHistory?: string; // Or any

  // Note: NO ownerId field here.
}