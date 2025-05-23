// backend/src/pets/pets.controller.ts
import { Controller, Post, Body, UseGuards, Request, ValidationPipe, HttpStatus, HttpCode,Get,Param,Patch,Delete, } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { Pet } from '@prisma/client'; // Import Pet type

@Controller('pets') // Base route for pet endpoints
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @UseGuards(JwtAuthGuard) // Protect this endpoint - only authenticated users can create pets
  @Post() // Handles POST requests to /pets
  @HttpCode(HttpStatus.CREATED) // Return 201 Created on success
  async create(
    @Request() req: any, // Get the request object to access req.user
    @Body(ValidationPipe) createPetDto: CreatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.userId; // Get the user ID from the authenticated user's JWT payload
    return this.petsService.create(ownerId, createPetDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get() // Handles GET requests to /pets
  async findAllByOwner(@Request() req: any): Promise<Pet[]> {
    const ownerId = req.user.userId;
    return this.petsService.findAllByOwner(ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id') // Handles GET requests to /pets/:id
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Pet> {
    const ownerId = req.user.userId;
    return this.petsService.findOne(id, ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') // Handles PATCH requests to /pets/:id for partial updates
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) updatePetDto: UpdatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.userId;
    return this.petsService.update(id, ownerId, updatePetDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id') // Handles DELETE requests to /pets/:id
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content for successful deletion
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const ownerId = req.user.userId;
    await this.petsService.remove(id, ownerId);
  } 
}
