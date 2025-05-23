// backend/src/activity-logs/activity-logs.controller.ts
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
  Query,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityLog, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard) // All activity log operations require authentication
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // --- Endpoints for Staff to create activity logs ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER) // Only staff roles can create logs
  async create(@Body(ValidationPipe) createActivityLogDto: CreateActivityLogDto, @Request() req): Promise<ActivityLog> {
    const staffId: string = req.user.id; // Get ID of authenticated staff user
    return this.activityLogsService.createActivityLog(createActivityLogDto, staffId);
  }

  // --- Endpoints for all authenticated users to view activity logs (with role-based filtering) ---
  @Get()
  async findAll(
    @Request() req,
    @Query('petId') petId?: string,
    @Query('daycareBookingId') daycareBookingId?: string,
    @Query('appointmentId') appointmentId?: string,
  ): Promise<ActivityLog[]> {
    const userRole: Role = req.user.role;
    const userId: string = req.user.id; // User ID for owner filtering
    return this.activityLogsService.findAllActivityLogs(userRole, userId, petId, daycareBookingId, appointmentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<ActivityLog> {
    const userRole: Role = req.user.role;
    const userId: string = req.user.id;
    return this.activityLogsService.findOneActivityLog(id, userRole, userId);
  }

  // --- Endpoints for Admin/Staff to update activity logs ---
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER) // Only staff roles can update (Admin can update any, others their own)
  async update(@Param('id') id: string, @Body(ValidationPipe) updateActivityLogDto: UpdateActivityLogDto, @Request() req): Promise<ActivityLog> {
    const userRole: Role = req.user.role;
    // const userId: string = req.user.id; // If you want to restrict staff to only update their own logs
    return this.activityLogsService.updateActivityLog(id, updateActivityLogDto, userRole);
  }

  // --- Endpoints for Admin to delete activity logs ---
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Only Admins can delete logs
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userRole: Role = req.user.role;
    return this.activityLogsService.removeActivityLog(id, userRole);
  }
}