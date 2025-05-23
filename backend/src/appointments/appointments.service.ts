// backend/src/appointments/appointments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; 
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, Role } from '@prisma/client'; // Import Appointment and Role types

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { petId, serviceId, appointmentDate, appointmentTime, notes } = createAppointmentDto;

    try {
      // 1. Verify Pet exists and belongs to the booking user (userId)
      const pet = await this.prisma.pet.findUnique({
        where: { id: petId },
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      }
      if (pet.ownerId !== userId) {
        throw new ForbiddenException(`Pet with ID "${petId}" does not belong to the authenticated user.`);
      }

      // 2. Verify Service exists
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID "${serviceId}" not found.`);
      }

      // 3. Convert date and time strings to correct formats for Prisma
      // Prisma's Date type expects a full ISO string (Date object) for `DateTime` fields.
      // For `@db.Date` and `@db.Time(0)`, you can pass Date objects, and Prisma will extract parts.
      const fullAppointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00Z`);

    // 4. Check for double booking (based on the @@unique constraint: [appointmentDate, appointmentTime, serviceId])
    // The error indicates Prisma expects a specific combined unique input type.
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: {
        appointmentDate_appointmentTime_serviceId: { // <--- CHANGE IS HERE!
          appointmentDate: fullAppointmentDateTime,
          appointmentTime: fullAppointmentDateTime,
          serviceId: serviceId,
        },
      },
    });

    if (existingAppointment) {
      throw new ConflictException('This service slot is already booked. Please choose a different time or service.');
    }

      // 5. Create the appointment
      return this.prisma.appointment.create({
        data: {
          ownerId: userId,
          petId: pet.id,
          serviceId: service.id,
          appointmentDate: fullAppointmentDateTime,
          appointmentTime: fullAppointmentDateTime, // Prisma will extract the time part due to @db.Time(0)
          notes,
          status: 'SCHEDULED', // Default status
        },
      });
    } catch (error) {
      // Handle specific errors thrown by our checks or Prisma errors
      if (error instanceof NotFoundException ||
          error instanceof ForbiddenException ||
          error instanceof ConflictException ||
          error instanceof BadRequestException) {
        throw error;
      }
      // Handle Prisma unique constraint error (P2002) if not caught by explicit check above
      if (error.code === 'P2002' && error.meta?.target?.includes('appointmentDate') && error.meta?.target?.includes('appointmentTime') && error.meta?.target?.includes('serviceId')) {
          throw new ConflictException('This service slot is already booked. Please choose a different time or service.');
      }
      console.error('Error creating appointment:', error);
      throw new InternalServerErrorException('Failed to create appointment.');
    }
  }

  // --- New Methods Below ---

  async findAll(userId: string, userRole: Role): Promise<Appointment[]> {
    try {
      const whereClause = userRole === Role.ADMIN || userRole === Role.CLINIC_STAFF || userRole === Role.GROOMER
      ? {} // Admins/Clinic Staff/Groomers can see all appointments
      : { ownerId: userId }; // Regular users (Owners) only see their own
      return this.prisma.appointment.findMany({
        where: whereClause,
        include: { // Include related data for richer response
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          pet: { select: { id: true, name: true, species: true } },
          service: { select: { id: true, name: true, price: true, type: true } },
          staff: { select: { id: true, firstName: true, lastName: true } }, // Include staff if assigned
        },
        orderBy: { appointmentDate: 'asc' }, // Order by date ascending
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new InternalServerErrorException('Failed to fetch appointments.');
    }
  }

  async findOne(appointmentId: string, userId: string, userRole: Role): Promise<Appointment> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          pet: { select: { id: true, name: true, species: true } },
          service: { select: { id: true, name: true, price: true, type: true } },
          staff: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }

      // Authorization check: Only owner, admin, or assigned staff can view
      if (appointment.ownerId !== userId && userRole !== Role.ADMIN && appointment.staffId !== userId) {
        throw new ForbiddenException('You do not have permission to view this appointment.');
      }

      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error fetching appointment with ID ${appointmentId}:`, error);
      throw new InternalServerErrorException('Failed to fetch appointment.');
    }
  }

  async update(
    appointmentId: string,
    userId: string,
    userRole: Role,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!existingAppointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }

      // Basic Authorization: Only owner, admin, or staff can update.
      // Owners can update notes, or potentially reschedule if allowed.
      // Staff/Admin can update status, assign staff, and reschedule.
        if (existingAppointment.ownerId !== userId && userRole !== Role.ADMIN && userRole !== Role.CLINIC_STAFF && userRole !== Role.GROOMER) {
          throw new ForbiddenException('You do not have permission to update this appointment.');
        }

      // Prevent regular users from changing critical fields like ownerId, petId, serviceId, staffId, status (unless explicitly allowed)
      if (userRole === Role.OWNER) {
        const disallowedUpdates = ['petId', 'serviceId', 'staffId', 'status', 'newAppointmentDate', 'newAppointmentTime']; // If user can't reschedule
        for (const field of disallowedUpdates) {
          if (updateAppointmentDto.hasOwnProperty(field) && field !== 'notes') { // Allow notes update
            throw new ForbiddenException(`Users are not allowed to update ${field}.`);
          }
        }
        if (updateAppointmentDto.status && updateAppointmentDto.status !== 'CANCELLED') {
             throw new ForbiddenException('Users can only change status to CANCELLED.');
        }
        if (updateAppointmentDto.newAppointmentDate || updateAppointmentDto.newAppointmentTime) {
            // If users are allowed to reschedule, you'd add more logic here.
            // For now, disallow if not ADMIN/STAFF.
            throw new ForbiddenException('Users cannot reschedule appointments. Please contact staff.');
        }
      }

      // Handle rescheduling logic
      let updatedAppointmentDate: Date | undefined;
      let updatedAppointmentTime: Date | undefined;
      if (updateAppointmentDto.newAppointmentDate || updateAppointmentDto.newAppointmentTime) {
        const datePart = updateAppointmentDto.newAppointmentDate || existingAppointment.appointmentDate.toISOString().split('T')[0];
        const timePart = updateAppointmentDto.newAppointmentTime || existingAppointment.appointmentTime.toISOString().split('T')[1].substring(0, 5);
        const newFullDateTime = new Date(`${datePart}T${timePart}:00Z`);

        updatedAppointmentDate = newFullDateTime;
        updatedAppointmentTime = newFullDateTime;

        // Check for conflicts with the new time slot
        const conflictCheck = await this.prisma.appointment.findUnique({
            where: {
                appointmentDate_appointmentTime_serviceId: {
                    appointmentDate: updatedAppointmentDate,
                    appointmentTime: updatedAppointmentTime,
                    serviceId: existingAppointment.serviceId, // Check with the original service
                },
            },
        });

        // Ensure the conflict is not with the appointment itself if only notes changed but time/date are same.
        if (conflictCheck && conflictCheck.id !== appointmentId) {
            throw new ConflictException('The requested new service slot is already booked.');
        }
      }

      const dataToUpdate: any = {
        notes: updateAppointmentDto.notes,
        status: updateAppointmentDto.status,
        staffId: updateAppointmentDto.staffId,
        appointmentDate: updatedAppointmentDate,
        appointmentTime: updatedAppointmentTime,
      };

      // Filter out undefined values to avoid updating fields unintentionally
      Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

      return this.prisma.appointment.update({
        where: { id: appointmentId },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error updating appointment with ID ${appointmentId}:`, error);
      throw new InternalServerErrorException('Failed to update appointment.');
    }
  }

  async remove(appointmentId: string, userId: string, userRole: Role): Promise<void> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }

      // Authorization check: Only owner, admin, or assigned staff can delete/cancel
      if (appointment.ownerId !== userId && userRole !== Role.ADMIN && userRole !== Role.CLINIC_STAFF && userRole !== Role.GROOMER) {
        throw new ForbiddenException('You do not have permission to cancel this appointment.');
      }

      // Optional: Prevent deletion if appointment is already completed or in a certain status
      // if (appointment.status === 'COMPLETED') {
      //   throw new BadRequestException('Cannot cancel a completed appointment.');
      // }

      // Instead of hard delete, you might want to update status to 'CANCELLED'
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }, // Recommended: Change status to CANCELLED instead of hard delete
      });

      // If you truly want to hard delete:
      // await this.prisma.appointment.delete({
      //   where: { id: appointmentId },
      // });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error deleting appointment with ID ${appointmentId}:`, error);
      throw new InternalServerErrorException('Failed to cancel appointment.');
    }
  }
}
