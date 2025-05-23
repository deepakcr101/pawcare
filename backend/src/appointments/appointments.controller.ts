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

@Controller('appointments')
@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to all methods in this controller
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // JwtAuthGuard is applied at controller level, so no need here
  async create(
    @Request() req,
    @Body(ValidationPipe) createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const userId = req.user.id;
    return this.appointmentsService.create(userId, createAppointmentDto);
  }

  @Get()
  // Uses RolesGuard for fine-grained access based on role (ADMIN/STAFF can see all, USER only their own)
  @UseGuards(RolesGuard) // Apply RolesGuard for findAll
  async findAll(@Request() req): Promise<Appointment[]> {
    const userId = req.user.id;
    const userRole: Role = req.user.role; // Assuming role is available in req.user
    return this.appointmentsService.findAll(userId, userRole);
  }

  @Get(':id')
  // No additional RolesGuard needed here; logic is in service
  async findOne(@Param('id') id: string, @Request() req): Promise<Appointment> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    return this.appointmentsService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  // No additional RolesGuard needed here; logic is in service
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body(ValidationPipe) updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    return this.appointmentsService.update(id, userId, userRole, updateAppointmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content for successful cancellation/deletion
  // No additional RolesGuard needed here; logic is in service
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    const userRole: Role = req.user.role;
    await this.appointmentsService.remove(id, userId, userRole);
  }
}
