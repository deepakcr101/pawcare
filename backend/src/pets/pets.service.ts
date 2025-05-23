// backend/src/pets/pets.service.ts
import { Injectable, InternalServerErrorException,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from '@prisma/client'; // Import Pet type from Prisma Client

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {} // Inject PrismaService

  async create(ownerId: string, createPetDto: CreatePetDto): Promise<Pet> {
    try {
      const { dateOfBirth, medicalHistory, vaccinationHistory, ...rest } = createPetDto;

      // Parse date string to Date object
      const parsedDateOfBirth = new Date(dateOfBirth);

      // Parse JSON strings to objects (or null if not provided)
      const parsedMedicalHistory = medicalHistory ? JSON.parse(medicalHistory) : null;
      const parsedVaccinationHistory = vaccinationHistory ? JSON.parse(vaccinationHistory) : null;

      return this.prisma.pet.create({
        data: {
          ...rest, // Other fields from DTO
          dateOfBirth: parsedDateOfBirth,
          medicalHistory: parsedMedicalHistory,
          vaccinationHistory: parsedVaccinationHistory,
          owner: {
            connect: { id: ownerId }, // Link the pet to the owner's ID
          },
        },
      });
    } catch (error) {
      console.error('Error creating pet:', error);
      throw new InternalServerErrorException('Failed to create pet.');
    }
  }
  
  async findAllByOwner(ownerId: string): Promise<Pet[]> {
    try {
      return this.prisma.pet.findMany({
        where: { ownerId }, // Filter pets by the authenticated owner's ID
      });
    } catch (error) {
      console.error('Error fetching pets for owner:', error);
      throw new InternalServerErrorException('Failed to fetch pets.');
    }
  }

  async findOne(petId: string, ownerId: string): Promise<Pet> {
    try {
      const pet = await this.prisma.pet.findUnique({
        where: {
          id: petId,
          ownerId: ownerId, // Ensure the pet belongs to the authenticated owner
        },
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID "${petId}" not found for this owner.`);
      }

      return pet;
    } catch (error) {
      // Re-throw NotFoundException, otherwise log and throw generic error
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching pet with ID ${petId}:`, error);
      throw new InternalServerErrorException('Failed to fetch pet.');
    }
  }

  async update(petId: string, ownerId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    // First, ensure the pet exists and belongs to the authenticated owner
    const existingPet = await this.prisma.pet.findUnique({
      where: {
        id: petId,
        ownerId: ownerId,
      },
    });

    if (!existingPet) {
      throw new NotFoundException(`Pet with ID "${petId}" not found for this owner.`);
    }

    try {
      const { dateOfBirth, medicalHistory, vaccinationHistory, ...rest } = updatePetDto;

      // Prepare data for update: parse date and JSON strings if provided
      const dataToUpdate: any = { ...rest };

      if (dateOfBirth !== undefined) {
        dataToUpdate.dateOfBirth = new Date(dateOfBirth);
      }
      if (medicalHistory !== undefined) {
        dataToUpdate.medicalHistory = medicalHistory ? JSON.parse(medicalHistory) : null;
      }
      if (vaccinationHistory !== undefined) {
        dataToUpdate.vaccinationHistory = vaccinationHistory ? JSON.parse(vaccinationHistory) : null;
      }

      return this.prisma.pet.update({
        where: { id: petId },
        data: dataToUpdate,
      });
    } catch (error) {
      // Re-throw NotFoundException, otherwise log and throw generic error
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating pet with ID ${petId}:`, error);
      throw new InternalServerErrorException('Failed to update pet.');
    }
  }

  async remove(petId: string, ownerId: string): Promise<void> {
    // First, ensure the pet exists and belongs to the authenticated owner
    const existingPet = await this.prisma.pet.findUnique({
      where: {
        id: petId,
        ownerId: ownerId,
      },
    });

    if (!existingPet) {
      throw new NotFoundException(`Pet with ID "${petId}" not found for this owner.`);
    }

    try {
      await this.prisma.pet.delete({
        where: { id: petId },
      });
    } catch (error) {
      // Re-throw NotFoundException, otherwise log and throw generic error
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error deleting pet with ID ${petId}:`, error);
      throw new InternalServerErrorException('Failed to delete pet.');
    }
   }

  // We'll add other CRUD methods (findAll, findOne, update, remove) here next
  // async findAll(ownerId: string): Promise<Pet[]> { ... }
  // async findOne(id: string): Promise<Pet | null> { ... }
  // async update(id: string, updatePetDto: UpdatePetDto): Promise<Pet> { ... }
  // async remove(id: string): Promise<Pet> { ... }
}

