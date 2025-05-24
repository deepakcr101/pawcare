// backend/src/pets/dto/create-pet.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsJSON,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { PetSpecies, PetGender } from '@prisma/client'; // Assumes these are now in your Prisma schema

export class CreatePetDto {
  @IsString()
  @IsNotEmpty({ message: 'Pet name cannot be empty.' })
  name!: string;

  @IsEnum(PetSpecies, { message: 'Invalid pet species.' })
  @IsNotEmpty({ message: 'Pet species cannot be empty.' })
  species!: PetSpecies;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(PetGender, { message: 'Invalid pet gender.' })
  @IsOptional() // Gender can be optional
  gender?: PetGender;

  @IsDateString(
    {},
    { message: 'Date of birth must be a valid ISO8601 date string (e.g., YYYY-MM-DD).' },
  )
  @IsNotEmpty({ message: 'Date of birth cannot be empty.' })
  dateOfBirth!: string; // Will be converted to DateTime in service

  @IsJSON({ message: 'Medical history must be a valid JSON string.' })
  @IsOptional()
  medicalHistory?: string; // e.g., '{"allergies": ["pollen"], "conditions": ["arthritis"]}'

  @IsJSON({ message: 'Vaccination history must be a valid JSON string.' })
  @IsOptional()
  vaccinationHistory?: string; // e.g., '{"rabies": "2023-05-10", "distemper": "2023-06-15"}'

  @IsUrl({}, { message: 'Avatar URL must be a valid URL.' })
  @IsOptional()
  avatarUrl?: string;
}
