// backend/src/activity-logs/activity-logs.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityLog, Role } from '@prisma/client';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async createActivityLog(createActivityLogDto: CreateActivityLogDto, staffId: string): Promise<ActivityLog> {
    const { petId, activityType, details, daycareBookingId, appointmentId } = createActivityLogDto;

    // Validate that either daycareBookingId or appointmentId (or neither) is provided
    if (daycareBookingId && appointmentId) {
      throw new BadRequestException('An activity log can only be linked to a daycare booking OR an appointment, not both.');
    }

    try {
      // 1. Verify Pet exists
      const pet = await this.prisma.pet.findUnique({
        where: { id: petId },
      });
      if (!pet) {
        throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      }

      // 2. Verify DaycareBooking exists if provided
      if (daycareBookingId) {
        const booking = await this.prisma.daycareBooking.findUnique({
          where: { id: daycareBookingId },
        });
        if (!booking) {
          throw new NotFoundException(`Daycare booking with ID "${daycareBookingId}" not found.`);
        }
        // Optional: Further validation, e.g., ensure petId matches booking's petId
        if (booking.petId !== petId) {
            throw new BadRequestException(`The provided petId "${petId}" does not match the pet for daycare booking "${daycareBookingId}".`);
        }
      }

      // 3. Verify Appointment exists if provided
      if (appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: appointmentId },
        });
        if (!appointment) {
          throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
        }
        // Optional: Further validation, e.g., ensure petId matches appointment's petId
         if (appointment.petId !== petId) {
            throw new BadRequestException(`The provided petId "${petId}" does not match the pet for appointment "${appointmentId}".`);
        }
      }

      return this.prisma.activityLog.create({
        data: {
          petId,
          staffId, // The authenticated staff member's ID
          activityType,
          details,
          daycareBookingId,
          appointmentId,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error creating activity log:', error);
      throw new InternalServerErrorException('Failed to create activity log.');
    }
  }

  async findAllActivityLogs(userRole: Role, userId: string, petId?: string, daycareBookingId?: string, appointmentId?: string): Promise<ActivityLog[]> {
    const whereClause: any = {};

    // Filter by petId if provided
    if (petId) {
      whereClause.petId = petId;
    }

    // Filter by daycareBookingId if provided
    if (daycareBookingId) {
      whereClause.daycareBookingId = daycareBookingId;
    }

    // Filter by appointmentId if provided
    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    // Owners can only see activities related to their own pets
    if (userRole === Role.OWNER) {
      whereClause.pet = {
        ownerId: userId,
      };
    }

    try {
      return this.prisma.activityLog.findMany({
        where: whereClause,
        include: {
          pet: true, // Include pet details
          staff: { select: { id: true, firstName: true, lastName: true } }, // Include staff details
          daycareBooking: true, // Include daycare booking details
          appointment: true, // Include appointment details
        },
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw new InternalServerErrorException('Failed to fetch activity logs.');
    }
  }

  async findOneActivityLog(id: string, userRole: Role, userId: string): Promise<ActivityLog> {
    try {
      const activityLog = await this.prisma.activityLog.findUnique({
        where: { id },
        include: {
          pet: true,
          staff: { select: { id: true, firstName: true, lastName: true } },
          daycareBooking: true,
          appointment: true,
        },
      });

      if (!activityLog) {
        throw new NotFoundException(`Activity log with ID "${id}" not found.`);
      }

      // Owners can only view logs for their own pets
       if (userRole === Role.OWNER) {
        if (!activityLog.pet || activityLog.pet.ownerId !== userId) { // Added !activityLog.pet check
          throw new ForbiddenException('You do not have permission to view this activity log.');
        }
      }

      return activityLog;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error fetching activity log with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch activity log.');
    }
  }

  async updateActivityLog(id: string, updateActivityLogDto: UpdateActivityLogDto, userRole: Role): Promise<ActivityLog> {
    // Activity logs should generally only be updated by Admins or the staff who created them.
    // For simplicity, we'll allow Admins to update any, and the creating staff to update their own.
    // We won't allow owners to update activity logs.

    try {
      const existingLog = await this.prisma.activityLog.findUnique({
        where: { id },
      });

      if (!existingLog) {
        throw new NotFoundException(`Activity log with ID "${id}" not found.`);
      }

      // Only Admins or the staff who created the log can update it
      // if (userRole !== Role.ADMIN && existingLog.staffId !== userId) {
      //     throw new ForbiddenException('You do not have permission to update this activity log.');
      // }
      // The above check requires passing userId to update, which we'll handle in controller based on role.

      return this.prisma.activityLog.update({
        where: { id },
        data: updateActivityLogDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error updating activity log with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update activity log.');
    }
  }

  async removeActivityLog(id: string, userRole: Role): Promise<void> {
    // Activity logs should generally only be deleted by Admins.
    try {
      const existingLog = await this.prisma.activityLog.findUnique({
        where: { id },
      });

      if (!existingLog) {
        throw new NotFoundException(`Activity log with ID "${id}" not found.`);
      }

      // Only Admins can delete activity logs
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException('You do not have permission to delete this activity log.');
      }

      await this.prisma.activityLog.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error deleting activity log with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete activity log.');
    }
  }
}