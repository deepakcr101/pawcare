// backend/src/daycare-bookings/dto/create-daycare-booking.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { DaycareBookingStatus } from '@prisma/client';

export class CreateDaycareBookingDto {
  @IsUUID()
  @IsNotEmpty()
  daycareSessionId!: string; // The ID of the DaycareSession the pet is being booked into

  @IsUUID()
  @IsNotEmpty()
  petId!: string; // The ID of the pet being booked

  @IsUUID()
  @IsOptional()
  roomId?: string; // Optional: ID of the DaycareRoom if assigned at booking time

  @IsEnum(DaycareBookingStatus)
  @IsOptional()
  status?: DaycareBookingStatus; // Defaults to BOOKED
}