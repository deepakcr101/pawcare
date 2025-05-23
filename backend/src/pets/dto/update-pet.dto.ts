import { IsString, IsOptional, IsDateString, IsJSON } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'; // Import PartialType
import { CreatePetDto } from './create-pet.dto';

// Install @nestjs/mapped-types if you haven't already:
// npm install @nestjs/mapped-types
// or yarn add @nestjs/mapped-types

// Inherits all properties from CreatePetDto, but makes them optional
export class UpdatePetDto extends PartialType(CreatePetDto) {
  // You can add specific validation rules here if needed,
  // or override existing ones if they differ from CreatePetDto
}
