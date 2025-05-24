// backend/src/pets/pets.controller.ts
import {
  Controller, Post, Body, UseGuards, Request, ValidationPipe,
  HttpStatus, HttpCode, Get, Param, Patch, Delete, ForbiddenException // <-- Add ForbiddenException
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; // <-- Import RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // <-- Import Roles decorator
import { Role } from '@prisma/client'; // <-- Import Role enum
import { Pet } from '@prisma/client';

@Controller('pets') // Base route for pet endpoints
// Apply JwtAuthGuard and RolesGuard at the controller level to protect all routes by default
@UseGuards(JwtAuthGuard, RolesGuard) // <-- Apply guards here
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  // 1. Create Pet: Only OWNERs can create their pets
  @Post() // Handles POST requests to /pets
  @Roles(Role.OWNER) // <-- Only OWNERs can create pets
  @HttpCode(HttpStatus.CREATED) // Return 201 Created on success
  async create(
    @Request() req: any, // Get the request object to access req.user
    @Body(ValidationPipe) createPetDto: CreatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.id; // Get the user ID from the authenticated user's JWT payload
    return this.petsService.create(ownerId, createPetDto);
  }

  // 2. Get All Pets (for Admin/Staff): ADMINs and CLINIC_STAFF can see all pets
  @Get() // Handles GET requests to /pets
  @Roles(Role.ADMIN, Role.CLINIC_STAFF) // <-- Only ADMINs and CLINIC_STAFF can see all pets
  async findAll(): Promise<Pet[]> { // Note: This is findAll, not findAllByOwner
    return this.petsService.findAll(); // This service method needs to be implemented/modified
  }

  // 3. Get My Pets (for Owner): OWNERs can see their own pets
  @Get('my') // <-- Changed route to /pets/my for clarity
  @Roles(Role.OWNER) // <-- Only OWNERs can access this specific endpoint
  async findAllByOwner(@Request() req: any): Promise<Pet[]> {
    const ownerId = req.user.sub;;
    return this.petsService.findAllByOwner(ownerId);
  }

  // 4. Get Single Pet: OWNERs can see their own, ADMIN/STAFF can see any
  @Get(':id') // Handles GET requests to /pets/:id
  @Roles(Role.OWNER, Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER) // <-- All relevant roles can view a single pet
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Pet> {
    const userId = req.user.sub; 
    const userRole = req.user.role;
    const pet = await this.petsService.findOne(id); // Get the pet first

    // If the user is an OWNER, ensure they own the pet
    if (userRole === Role.OWNER && pet.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this pet.');
    }
    // For ADMIN/STAFF/GROOMER, no explicit ownership check is needed here, as they can view any.
    return pet;
  }

  // 5. Update Pet: Only OWNERs can update their pets
  @Patch(':id') // Handles PATCH requests to /pets/:id for partial updates
  @Roles(Role.OWNER) // <-- Only OWNERs can update their pets
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) updatePetDto: UpdatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.sub; 
    return this.petsService.update(id, ownerId, updatePetDto);
  }

  // 6. Delete Pet: Only OWNERs can delete their pets
  @Delete(':id') // Handles DELETE requests to /pets/:id
  @Roles(Role.OWNER) // <-- Only OWNERs can delete their pets
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content for successful deletion
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const ownerId = req.user.sub; 
    await this.petsService.remove(id, ownerId);
  }
}