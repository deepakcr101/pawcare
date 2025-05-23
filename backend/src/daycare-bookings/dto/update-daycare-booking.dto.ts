// backend/src/daycare-bookings/dto/update-daycare-booking.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDaycareBookingDto } from './create-daycare-booking.dto';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { DaycareBookingStatus } from '@prisma/client';

export class UpdateDaycareBookingDto extends PartialType(CreateDaycareBookingDto) {
  // All properties from CreateDaycareBookingDto are inherited and made optional

  @IsEnum(DaycareBookingStatus)
  @IsOptional()
  status?: DaycareBookingStatus; // Allows changing the booking status (e.g., CHECKED_IN, CHECKED_OUT, CANCELLED)

  @IsUUID()
  @IsOptional()
  roomId?: string; // Allows changing or assigning a room after booking
}