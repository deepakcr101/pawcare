// backend/src/appointments/dto/create-appointment.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  petId!: string; // The ID of the pet for whom the appointment is booked

  @IsUUID()
  @IsNotEmpty()
  serviceId!: string; // The ID of the service being booked

  @IsDateString() // Validates string as a date (e.g., "YYYY-MM-DD")
  @IsNotEmpty()
  appointmentDate!: string; // Date of the appointment (e.g., "2025-06-15")

  @IsString() // Validates string as a time (e.g., "HH:MM")
  @IsNotEmpty()
  // This will be parsed and stored as a Time type in Prisma
  appointmentTime!: string; // Time of the appointment (e.g., "14:30")

  @IsString()
  @IsOptional()
  notes?: string; // Any specific notes for the appointment
}
