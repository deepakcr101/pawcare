// backend/src/activity-logs/dto/create-activity-log.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ActivityType } from '@prisma/client'; // Import the ActivityType enum

export class CreateActivityLogDto {
  @IsUUID()
  @IsNotEmpty()
  petId!: string; // The ID of the pet for which the activity is logged

  @IsEnum(ActivityType)
  @IsNotEmpty()
  activityType!: ActivityType; // The type of activity (e.g., FEEDING, WALKING)

  @IsString()
  @IsNotEmpty()
  @MaxLength(500) // Limit the length of the details
  details!: string; // Detailed description of the activity

  @IsUUID()
  @IsOptional()
  daycareBookingId?: string; // Optional: Link to a specific daycare booking

  @IsUUID()
  @IsOptional()
  appointmentId?: string; // Optional: Link to a specific appointment
}