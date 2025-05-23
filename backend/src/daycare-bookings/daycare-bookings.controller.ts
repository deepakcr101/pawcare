// backend/src/daycare-bookings/daycare-bookings.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { DaycareBookingsService } from './daycare-bookings.service';
import { CreateDaycareBookingDto } from './dto/create-daycare-booking.dto';
import { UpdateDaycareBookingDto } from './dto/update-daycare-booking.dto';
import { DaycareBooking, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('daycare-bookings')
@UseGuards(JwtAuthGuard) // All daycare booking operations require authentication
export class DaycareBookingsController {
  constructor(private readonly daycareBookingsService: DaycareBookingsService) {}

  // --- Endpoints for OWNERs to create their own bookings ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard) // Apply RolesGuard specifically for this route
  @Roles(Role.OWNER, Role.ADMIN) // Owners can create, Admin can create for others
  async create(@Body(ValidationPipe) createDaycareBookingDto: CreateDaycareBookingDto, @Request() req): Promise<DaycareBooking> {
    const userId: string = req.user.id; // Get ID of authenticated user
    return this.daycareBookingsService.createDaycareBooking(createDaycareBookingDto, userId);
  }

  // --- Endpoints for all authenticated users (OWNER, ADMIN, STAFF) ---
  @Get()
  async findAll(@Request() req): Promise<DaycareBooking[]> {
    const userRole: Role = req.user.role;
    const userId: string = req.user.id;
    return this.daycareBookingsService.findAllDaycareBookings(userRole, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<DaycareBooking> {
    const userRole: Role = req.user.role;
    const userId: string = req.user.id;
    return this.daycareBookingsService.findOneDaycareBooking(id, userId, userRole);
  }

  @Patch(':id')
  // Allow ADMIN/STAFF to update any booking. OWNER can only cancel their own.
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDaycareBookingDto: UpdateDaycareBookingDto,
    @Request() req,
  ): Promise<DaycareBooking> {
    const userId: string = req.user.id;
    const userRole: Role = req.user.role;
    return this.daycareBookingsService.updateDaycareBooking(id, updateDaycareBookingDto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN) // Owners can delete their own pending bookings, Admin can delete any
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId: string = req.user.id;
    const userRole: Role = req.user.role;
    return this.daycareBookingsService.removeDaycareBooking(id, userId, userRole);
  }
}