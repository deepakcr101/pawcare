// backend/src/services/services.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { RolesGuard } from '../auth/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // Import Roles decorator
import { Role } from '@prisma/client'; // Import Role enum from Prisma client
import { Service } from '@prisma/client'; // Import Service type

@Controller('services') // Base route for service endpoints
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard) // Protect with Auth and Roles
  @Roles(Role.ADMIN) // Only ADMIN can create services
  async create(@Body(ValidationPipe) createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  // While only ADMIN can create/update/delete, regular users might need to view services
  // If only ADMINs should see services, add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles(Role.ADMIN)
  async findAll(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  // Same as findAll, regular users might need to view a specific service
  async findOne(@Param('id') id: string): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Protect with Auth and Roles
  @Roles(Role.ADMIN) // Only ADMIN can update services
  async update(@Param('id') id: string, @Body(ValidationPipe) updateServiceDto: UpdateServiceDto): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content for successful deletion
  @UseGuards(JwtAuthGuard, RolesGuard) // Protect with Auth and Roles
  @Roles(Role.ADMIN) // Only ADMIN can delete services
  async remove(@Param('id') id: string): Promise<void> {
    await this.servicesService.remove(id);
  }
}
