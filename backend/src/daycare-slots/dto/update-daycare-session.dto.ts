// backend/src/daycare-slots/dto/update-daycare-session.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateDaycareSessionDto } from './create-daycare-session.dto'; 
import { IsOptional, IsInt, Min, IsNumber, IsPositive, IsEnum, IsDateString } from 'class-validator';
import { DaycareSessionStatus } from '@prisma/client';

export class UpdateDaycareSessionDto extends PartialType(CreateDaycareSessionDto) {	// All properties from CreateDaycareSessionDto are inherited and made optional

  @IsInt()
  @Min(0) // Capacity can be set to 0 to effectively close it
  @IsOptional()
  totalCapacity?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsEnum(DaycareSessionStatus)
  @IsOptional()
  status?: DaycareSessionStatus; // Allows changing the slot status (e.g., to FULL, CLOSED)

  @IsDateString()
  @IsOptional()
  newDate?: string; // Option to change the date of a session
}
