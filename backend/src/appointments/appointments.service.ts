// backend/src/appointments/appointments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment, Role, User as PrismaUser, Service, Prisma } from '@prisma/client'; // Added Service here

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(bookingUserId: string, createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { petId, serviceId, dateTime, staffId, notes } = createAppointmentDto;

    const appointmentDateTime = new Date(dateTime);

    if (isNaN(appointmentDateTime.getTime())) {
      throw new BadRequestException('Invalid dateTime format. Please use ISO8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).');
    }

    try {
      const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
      if (!pet) throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      if (pet.ownerId !== bookingUserId) {
        throw new ForbiddenException(`Pet with ID "${petId}" does not belong to the authenticated user.`);
      }

      const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.isActive) {
        throw new NotFoundException(`Active service with ID "${serviceId}" not found.`);
      }
      if (service.durationMinutes === null || service.durationMinutes === undefined) { // Check for null or undefined
        throw new BadRequestException(`Service with ID "${serviceId}" does not have a duration configured.`);
      }

      const staffMember = await this.prisma.user.findUnique({ where: { id: staffId } });
      if (!staffMember || (staffMember.role !== Role.CLINIC_STAFF && staffMember.role !== Role.GROOMER)) {
        throw new NotFoundException(`Staff member with ID "${staffId}" not found or is not valid staff.`);
      }

      const staffCanPerformService = await this.prisma.staffService.findUnique({
        where: { staffId_serviceId: { staffId, serviceId } },
      });
      if (!staffCanPerformService) {
        throw new BadRequestException(`Staff member "${staffMember.firstName}" is not qualified for service "${service.name}".`);
      }

      const appointmentEndTime = new Date(appointmentDateTime.getTime() + service.durationMinutes * 60000);

      const availableSlot = await this.prisma.staffAvailability.findFirst({
        where: {
          staffId,
          startTime: { lte: appointmentDateTime },
          endTime: { gte: appointmentEndTime },
        },
      });
      if (!availableSlot) {
        throw new ConflictException(`Staff member "${staffMember.firstName}" is not available at the requested time for this service duration.`);
      }

      // Prisma will check the @@unique([dateTime, staffId], name: "unique_staff_time_slot") constraint upon creation.
      // An explicit check for overlapping appointments can be added here for better UX before Prisma throws P2002.
      // For example:
      const conflictingAppointments = await this.prisma.appointment.findMany({
        where: {
          staffId: staffId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          // Check if existing appointment overlaps with the new one's time range
          // (existing.startTime < new.endTime) AND (existing.endTime > new.startTime)
          // This requires knowing the duration of existing appointments
          // For simplicity, we'll rely on the unique constraint primarily for exact start time + staff,
          // but a full overlap check is more robust.
          // This simplified check looks for appointments that start during the proposed slot.
          dateTime: {
            lt: appointmentEndTime, // Existing appointment starts before new one ends
            gte: appointmentDateTime, // Existing appointment starts at or after new one starts
          },
        },
      });

      if (conflictingAppointments.length > 0) {
         // A more granular check considering durations of these conflicting appointments is needed.
         // For now, if any appointment starts within this proposed window for this staff, flag it.
         throw new ConflictException('The selected staff member has a conflicting appointment during this time.');
      }


      return this.prisma.appointment.create({
        data: {
          ownerId: bookingUserId,
          petId,
          serviceId,
          staffId,
          dateTime: appointmentDateTime,
          notes,
          status: 'SCHEDULED',
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException ||
          error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('unique_staff_time_slot')) {
        throw new ConflictException('This time slot with the selected staff is already booked (unique constraint).');
      }
      console.error('Error creating appointment:', error);
      throw new InternalServerErrorException('Failed to create appointment.');
    }
  }

  async findAll(userId: string, userRole: Role): Promise<Appointment[]> {
    try {
      const whereClause = userRole === Role.ADMIN || userRole === Role.CLINIC_STAFF || userRole === Role.GROOMER
        ? {}
        : { ownerId: userId };
      return this.prisma.appointment.findMany({
        where: whereClause,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          pet: { select: { id: true, name: true, species: true } },
          service: { select: { id: true, name: true, price: true, type: true, durationMinutes: true } },
          staff: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { dateTime: 'asc' }, // CORRECTED: Was appointmentDate
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
          service: { select: { id: true, name: true, price: true, type: true, durationMinutes: true } },
          staff: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }

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
    userId: string, // User performing the update
    userRole: Role,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const { notes, status, staffId: newStaffId, newAppointmentDate, newAppointmentTime } = updateAppointmentDto;

    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: { select: { durationMinutes: true } } }, // Include service for duration
      });

      if (!existingAppointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }
      if (!existingAppointment.service.durationMinutes) {
        throw new BadRequestException("Cannot process update: existing appointment's service has no duration.");
      }


      if (
        existingAppointment.ownerId !== userId &&
        userRole !== Role.ADMIN &&
        userRole !== Role.CLINIC_STAFF &&
        userRole !== Role.GROOMER &&
        existingAppointment.staffId !== userId // Allow assigned staff to modify (e.g. status)
      ) {
        throw new ForbiddenException('You do not have permission to update this appointment.');
      }

      const dataToUpdate: Prisma.AppointmentUpdateInput = {}; // Use Prisma.AppointmentUpdateInput for type safety

      if (userRole === Role.OWNER) {
        if (notes !== undefined) dataToUpdate.notes = notes;
        if (status !== undefined) {
          if (status === 'CANCELLED') dataToUpdate.status = status;
          else throw new ForbiddenException('Owners can only update status to CANCELLED.');
        }
        // Disallow owners from changing other fields
        const forbiddenFields = ['staffId', 'newAppointmentDate', 'newAppointmentTime', 'petId', 'serviceId'];
        for (const field of forbiddenFields) {
            if (updateAppointmentDto.hasOwnProperty(field)) {
                 throw new ForbiddenException(`Owners are not allowed to update '${field}'.`);
            }
        }
      } else { // ADMIN, CLINIC_STAFF, GROOMER
        if (notes !== undefined) dataToUpdate.notes = notes;
        if (status !== undefined) dataToUpdate.status = status;
        if (newStaffId !== undefined) {
          dataToUpdate.staff = { // Use the relation field name 'staff'
            connect: { id: newStaffId } // Connect to the User record by its id
          };
        }
      }

      let finalStaffIdForCheck = newStaffId || existingAppointment.staffId;

      if (newAppointmentDate || newAppointmentTime) {
        if (userRole === Role.OWNER) {
             throw new ForbiddenException('Owners cannot reschedule appointments. Please contact staff.');
        }
        const originalDateTime = existingAppointment.dateTime;
        const datePart = newAppointmentDate || originalDateTime.toISOString().split('T')[0];
        // Ensure newAppointmentTime is in HH:mm format if used
        const timePart = newAppointmentTime || 
                         `${originalDateTime.getUTCHours().toString().padStart(2, '0')}:${originalDateTime.getUTCMinutes().toString().padStart(2, '0')}`;
        
        const newProposedDateTime = new Date(`${datePart}T${timePart}:00.000Z`); // Ensure UTC

        if (isNaN(newProposedDateTime.getTime())) {
            throw new BadRequestException('Invalid new appointment date/time format.');
        }
        dataToUpdate.dateTime = newProposedDateTime;

        // --- Refined Conflict Check for Reschedule ---
        const serviceToUse = await this.prisma.service.findUnique({ 
            where: { id: existingAppointment.serviceId } 
        });
        if (!serviceToUse || serviceToUse.durationMinutes === null) {
            throw new BadRequestException("Service details are missing for conflict checking.");
        }
        const appointmentEndTime = new Date(newProposedDateTime.getTime() + serviceToUse.durationMinutes * 60000);

        // Check staff availability for the new slot
        const staffAvailability = await this.prisma.staffAvailability.findFirst({
            where: {
                staffId: finalStaffIdForCheck,
                startTime: { lte: newProposedDateTime },
                endTime: { gte: appointmentEndTime },
            },
        });
        if (!staffAvailability) {
            throw new ConflictException('Selected staff is not available for the new requested time slot.');
        }
        
        // Check for other appointments for this staff that would overlap
        const conflictingAppointments = await this.prisma.appointment.findMany({
            where: {
                id: { not: appointmentId }, // Exclude the current appointment
                staffId: finalStaffIdForCheck,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                dateTime: { 
                    lt: appointmentEndTime, // An existing appt starts before the new one would end
                },
                // We need to calculate the endTime of each potential conflicting appointment
                // This is complex in a single query. A simpler check based on unique constraint violation
                // for the exact start time is an alternative, or iterate and check.
                // For now, let's check if any appointment starts at this exact new time for this staff.
                // The unique constraint will catch exact start time conflicts.
                // A more robust overlap check would be:
                // AND: [
                //   { dateTime: { lt: appointmentEndTime } }, // existing.start < new.end
                //   { 
                //      // existing.end > new.start - requires calculating existing.end dynamically
                //      // This is easier if you iterate or use a raw query for complex overlap logic
                //   }
                // ]
            }
        });
        // This check will be refined. The unique constraint will catch exact start time conflicts.
        if (conflictingAppointments.some(app => app.dateTime.getTime() === newProposedDateTime.getTime())) {
             throw new ConflictException('The new time slot for this staff member is already booked or conflicts with another appointment.');
        }
      }
      
      if (Object.keys(dataToUpdate).length === 0) {
        throw new BadRequestException('No valid fields provided for update.');
      }

      return this.prisma.appointment.update({
        where: { id: appointmentId },
        data: dataToUpdate,
      });
    } catch (error) {
      if ( error instanceof NotFoundException || error instanceof ForbiddenException ||
           error instanceof BadRequestException || error instanceof ConflictException ) {
        throw error;
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('unique_staff_time_slot')) {
        throw new ConflictException('The updated time slot with the selected staff is already booked (unique constraint).');
      }
      console.error(`Error updating appointment with ID ${appointmentId}:`, error);
      throw new InternalServerErrorException('Failed to update appointment.');
    }
  }

  async remove(appointmentId: string, userId: string, userRole: Role): Promise<void> {
    // ... (your existing remove method seems mostly fine, ensure it checks ownership/role correctly) ...
    // Consider if a staff member assigned to an appointment can cancel/remove it.
    // Your current check:
    // if (appointment.ownerId !== userId && userRole !== Role.ADMIN && userRole !== Role.CLINIC_STAFF && userRole !== Role.GROOMER)
    // This allows any staff to cancel any appointment if they have the generic role.
    // You might want to refine it to: appointment.staffId === userId for staff.
     try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
      }

      const isOwner = appointment.ownerId === userId;
      const isAdmin = userRole === Role.ADMIN;
      const isAssignedStaff = appointment.staffId === userId;
      const isAnyClinicStaffOrGroomer = userRole === Role.CLINIC_STAFF || userRole === Role.GROOMER;


      if (!isOwner && !isAdmin && !isAssignedStaff && !isAnyClinicStaffOrGroomer /* if any staff can cancel */) {
        throw new ForbiddenException('You do not have permission to cancel this appointment.');
      }
      
      // Instead of hard delete, update status to 'CANCELLED'
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error cancelling appointment with ID ${appointmentId}:`, error);
      throw new InternalServerErrorException('Failed to cancel appointment.');
    }
  }

  async findAvailableSlots(
    queryDto: { serviceId: string; date: string; staffId?: string; },
  ): Promise<Array<{ startTime: string; endTime: string; staffId: string; staffName: string }>> {
    const { serviceId, date, staffId: requestedStaffId } = queryDto;

    const requestedDateOnly = new Date(date + 'T00:00:00.000Z'); // Ensure date is treated as start of day UTC
    if (isNaN(requestedDateOnly.getTime())) {
      throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD.');
    }

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive || service.durationMinutes === null) {
      throw new NotFoundException(`Active service with ID "${serviceId}" not found or duration not set.`);
    }
    const serviceDuration = service.durationMinutes;

    let staffToCheck: Array<Pick<PrismaUser, 'id' | 'firstName' | 'lastName'>> = [];

    if (requestedStaffId) {
      const staffMember = await this.prisma.user.findUnique({
        where: { id: requestedStaffId },
        select: { id: true, firstName: true, lastName: true, role: true },
      });
      if (!staffMember || (staffMember.role !== Role.CLINIC_STAFF && staffMember.role !== Role.GROOMER)) {
        throw new NotFoundException(`Staff member with ID "${requestedStaffId}" not found or is not valid staff.`);
      }
      const canPerform = await this.prisma.staffService.findUnique({
        where: { staffId_serviceId: { staffId: requestedStaffId, serviceId } },
      });
      if (!canPerform) {
        throw new BadRequestException(`Staff member ${staffMember.firstName} is not qualified for service ${service.name}.`);
      }
      staffToCheck.push({ id: staffMember.id, firstName: staffMember.firstName, lastName: staffMember.lastName });
    } else {
      const qualifiedStaffRecords = await this.prisma.staffService.findMany({
        where: { serviceId },
        include: { staff: { select: { id: true, firstName: true, lastName: true, role: true } } },
      });
      staffToCheck = qualifiedStaffRecords
        .map(qs => qs.staff)
        .filter(staff => staff.role === Role.CLINIC_STAFF || staff.role === Role.GROOMER)
        .map(staff => ({id: staff.id, firstName: staff.firstName, lastName: staff.lastName }));
    }

    if (staffToCheck.length === 0) return [];

    const allAvailableSlots: Array<{ startTime: string; endTime: string; staffId: string; staffName: string }> = [];
    const dayStart = new Date(Date.UTC(requestedDateOnly.getUTCFullYear(), requestedDateOnly.getUTCMonth(), requestedDateOnly.getUTCDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(requestedDateOnly.getUTCFullYear(), requestedDateOnly.getUTCMonth(), requestedDateOnly.getUTCDate(), 23, 59, 59, 999));

    for (const staff of staffToCheck) {
      const staffAvailabilityBlocks = await this.prisma.staffAvailability.findMany({
        where: { staffId: staff.id, startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
        orderBy: { startTime: 'asc' },
      });

      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          staffId: staff.id,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          dateTime: { gte: dayStart, lt: dayEnd },
        },
        include: { service: { select: { durationMinutes: true } } },
        orderBy: { dateTime: 'asc' },
      });

      const bookedTimeRanges = existingAppointments.map(app => {
        if (app.service.durationMinutes === null) return null;
        return { start: app.dateTime, end: new Date(app.dateTime.getTime() + app.service.durationMinutes * 60000) };
      }).filter(slot => slot !== null) as Array<{ start: Date; end: Date }>;

      for (const block of staffAvailabilityBlocks) {
        let currentTimePointer = new Date(Math.max(block.startTime.getTime(), dayStart.getTime())); // Start from block start or day start

        while (currentTimePointer < block.endTime && currentTimePointer < dayEnd) {
          const slotStartTime = new Date(currentTimePointer);
          const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

          if (slotEndTime > block.endTime || slotEndTime > dayEnd) break; // Slot exceeds availability block or day end

          let isConflict = false;
          for (const booked of bookedTimeRanges) {
            if (slotStartTime < booked.end && slotEndTime > booked.start) { // Check for overlap
              isConflict = true;
              break;
            }
          }

          if (!isConflict) {
            allAvailableSlots.push({
              startTime: slotStartTime.toISOString(),
              endTime: slotEndTime.toISOString(),
              staffId: staff.id,
              staffName: `${staff.firstName} ${staff.lastName}`,
            });
          }
          // Advance pointer by a fixed interval (e.g., 15 mins) or by serviceDuration
          // Advancing by a fixed interval is often better for finding all possible start times
          currentTimePointer = new Date(currentTimePointer.getTime() + (15 * 60000)); // e.g., advance by 15 minutes
        }
      }
    }
    allAvailableSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return allAvailableSlots;
  }
}