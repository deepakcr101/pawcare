// backend/src/appointments/dto/update-appointment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { AppointmentStatus } from '@prisma/client'; // Import AppointmentStatus enum

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  // All properties from CreateAppointmentDto are inherited and made optional

  @IsEnum(AppointmentStatus) // Validate against your Prisma AppointmentStatus enum
  @IsOptional()
  status?: AppointmentStatus; // Allows updating the appointment status (e.g., CONFIRMED, CANCELLED)

  // You might want to allow rescheduling, which implies updating date and time
  @IsDateString()
  @IsOptional()
  newAppointmentDate?: string;

  @IsString()
  @IsOptional()
  newAppointmentTime?: string;

  @IsUUID()
  @IsOptional()
  staffId?: string; // If you decide to assign/reassign staff
}
