// backend/src/pets/pets.controller.ts
import {
  Controller, Post, Body, UseGuards, Request, ValidationPipe,
  HttpStatus, HttpCode, Get, Param, Patch, Delete, ForbiddenException
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Pet } from '@prisma/client';

@Controller('pets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body(ValidationPipe) createPetDto: CreatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.userId; // <-- CORRECTED: Changed from req.user.id
    return this.petsService.create(ownerId, createPetDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CLINIC_STAFF)
  async findAll(): Promise<Pet[]> {
    return this.petsService.findAll();
  }

  @Get('my')
  @Roles(Role.OWNER)
  async findAllByOwner(@Request() req: any): Promise<Pet[]> {
    const ownerId = req.user.userId; // <-- CORRECTED: Changed from req.user.sub
    return this.petsService.findAllByOwner(ownerId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER)
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Pet> {
    const userIdFromToken = req.user.userId; // <-- CORRECTED: Changed from req.user.sub, renamed for clarity
    const userRole = req.user.role; // This was correct
    const pet = await this.petsService.findOne(id);

    if (userRole === Role.OWNER && pet.ownerId !== userIdFromToken) {
      throw new ForbiddenException('You do not have permission to view this pet.');
    }
    return pet;
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) updatePetDto: UpdatePetDto,
  ): Promise<Pet> {
    const ownerId = req.user.userId; // <-- CORRECTED: Changed from req.user.sub
    return this.petsService.update(id, ownerId, updatePetDto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const ownerId = req.user.userId; // <-- CORRECTED: Changed from req.user.sub
    await this.petsService.remove(id, ownerId);
  }
}