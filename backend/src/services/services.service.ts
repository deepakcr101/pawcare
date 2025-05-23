// backend/src/services/services.service.ts
import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from '@prisma/client'; // Import Service type from Prisma Client

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      // Check if a service with the same name already exists
      const existingService = await this.prisma.service.findUnique({
        where: { name: createServiceDto.name },
      });
      if (existingService) {
        throw new ConflictException(`Service with name "${createServiceDto.name}" already exists.`);
      }

      return this.prisma.service.create({
        data: {
          ...createServiceDto,
          price: parseFloat(createServiceDto.price), // Convert string price to float for Prisma Decimal
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Re-throw specific NestJS exception
      }
      console.error('Error creating service:', error);
      throw new InternalServerErrorException('Failed to create service.');
    }
  }

  async findAll(): Promise<Service[]> {
    try {
      return this.prisma.service.findMany();
    } catch (error) {
      console.error('Error fetching all services:', error);
      throw new InternalServerErrorException('Failed to fetch services.');
    }
  }

  async findOne(id: string): Promise<Service> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
      });
      if (!service) {
        throw new NotFoundException(`Service with ID "${id}" not found.`);
      }
      return service;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching service with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch service.');
    }
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      // Check if service exists
      const existingService = await this.prisma.service.findUnique({
        where: { id },
      });
      if (!existingService) {
        throw new NotFoundException(`Service with ID "${id}" not found.`);
      }

      // If updating name, check for conflict with other existing service names
      if (updateServiceDto.name && updateServiceDto.name !== existingService.name) {
        const nameConflict = await this.prisma.service.findUnique({
          where: { name: updateServiceDto.name },
        });
        if (nameConflict) {
          throw new ConflictException(`Service with name "${updateServiceDto.name}" already exists.`);
        }
      }

      return this.prisma.service.update({
        where: { id },
        data: {
          ...updateServiceDto,
          price: updateServiceDto.price ? parseFloat(updateServiceDto.price) : undefined, // Conditionally convert price
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error(`Error updating service with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update service.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if service exists before attempting to delete
      const existingService = await this.prisma.service.findUnique({
        where: { id },
      });
      if (!existingService) {
        throw new NotFoundException(`Service with ID "${id}" not found.`);
      }

      await this.prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle Prisma errors like P2003 (Foreign key constraint failed) if a service is linked to appointments
      if (error.code === 'P2003') {
        throw new ConflictException('Cannot delete service because it is linked to existing appointments.');
      }
      console.error(`Error deleting service with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete service.');
    }
  }
}
