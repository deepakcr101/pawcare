// backend/src/pets/pets.service.ts
import { Injectable, InternalServerErrorException,NotFoundException,ForbiddenException } from '@nestjs/common';
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
  
  async findAll(): Promise<Pet[]> {
    try {
      return this.prisma.pet.findMany();
    } catch (error) {
      console.error('Error fetching all pets:', error);
      throw new InternalServerErrorException('Failed to fetch all pets.');
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

  async findOne(petId: string): Promise<Pet> { // Removed ownerId from parameters
    try {
      const pet = await this.prisma.pet.findUnique({
        where: { id: petId }, // Only filter by petId
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      }

      return pet;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching pet with ID ${petId}:`, error);
      throw new InternalServerErrorException('Failed to fetch pet.');
    }
  }

  async update(petId: string, ownerId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    // Controller already ensures the user has permission (e.g., is owner of this pet)
    // or is an admin/staff. If owner, the ownerId parameter will be passed.
    try {
      const { dateOfBirth, medicalHistory, vaccinationHistory, ...rest } = updatePetDto;

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

      // Check if pet exists and belongs to the owner before updating
      // This step can be optional here if you trust the controller's robust checks.
      // However, for sensitive operations like update/delete, it's safer to keep
      // an explicit ownership check in the service if an ownerId is provided.
      const existingPet = await this.prisma.pet.findUnique({
        where: { id: petId },
      });
      if (!existingPet) {
          throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      }
      // This is crucial: if an ownerId is provided (meaning an OWNER is performing the action),
      // we must ensure they own the pet. Admin/Staff won't pass an ownerId here.
      if (ownerId && existingPet.ownerId !== ownerId) {
          throw new ForbiddenException('You do not have permission to update this pet.');
      }


      return this.prisma.pet.update({
        where: { id: petId },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error updating pet with ID ${petId}:`, error);
      throw new InternalServerErrorException('Failed to update pet.');
    }
  }

  async remove(petId: string, ownerId: string): Promise<void> {
    // Controller handles the role check. If an OWNER is doing this, ownerId will be passed.
    try {
        const existingPet = await this.prisma.pet.findUnique({
            where: { id: petId },
        });

        if (!existingPet) {
            throw new NotFoundException(`Pet with ID "${petId}" not found.`);
        }
        // Similar to update: if an ownerId is provided, ensure ownership
        if (ownerId && existingPet.ownerId !== ownerId) {
            throw new ForbiddenException('You do not have permission to delete this pet.');
        }

        await this.prisma.pet.delete({
            where: { id: petId },
        });
    } catch (error) {
        if (error instanceof NotFoundException || error instanceof ForbiddenException) {
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

