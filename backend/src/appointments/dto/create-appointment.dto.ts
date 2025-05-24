// backend/src/appointments/dto/create-appointment.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  petId!: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsDateString() // Validates if the string is an ISO8601 date string.
  @IsNotEmpty()
  dateTime!: string; // e.g., "2025-07-15T14:30:00.000Z" (UTC is recommended)

  @IsUUID()
  @IsNotEmpty() // For now, let's make staffId mandatory for simplicity. Can be made optional later.
  staffId!: string; // The ID of the staff member (vet/groomer)

  @IsString()
  @IsOptional()
  notes?: string;
}