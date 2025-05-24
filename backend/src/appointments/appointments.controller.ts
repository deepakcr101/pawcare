// backend/src/appointments/appointments.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; // Import UpdateAppointmentDto
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; // Import RolesGuard for staff/admin roles
import { Roles } from '../auth/decorators/roles.decorator'; // Import Roles decorator
import { Role } from '@prisma/client'; // Import Role enum
import { Appointment } from '@prisma/client';
import { FindSlotsDto } from './dto/find-slots.dto'; // Import the new DTO
import { Query } from '@nestjs/common'; 


@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body(ValidationPipe) createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const bookingUserId = req.user.userId;
    return this.appointmentsService.create(bookingUserId, createAppointmentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  async findAll(@Request() req): Promise<Appointment[]> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    return this.appointmentsService.findAll(userId, userRole);
  }

  @Get('available-slots')  // <-- move this up
  async getAvailableSlots(@Query(ValidationPipe) findSlotsDto: FindSlotsDto): Promise<any[]> {
    return this.appointmentsService.findAvailableSlots(findSlotsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Appointment> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    return this.appointmentsService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Request() req, @Body(ValidationPipe) updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    return this.appointmentsService.update(id, userId, userRole, updateAppointmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    await this.appointmentsService.remove(id, userId, userRole);
  }
}
