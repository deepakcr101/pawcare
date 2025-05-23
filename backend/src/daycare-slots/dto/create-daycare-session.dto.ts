// backend/src/daycare-slots/dto/create-daycare-session.dto.ts
import { IsDateString, IsNotEmpty, IsInt, Min, IsNumber, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { DaycareSessionStatus } from '@prisma/client'; 

export class CreateDaycareSessionDto { 
  @IsDateString()
  @IsNotEmpty()
  date!: string; // The date for this daycare session

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  totalCapacity!: number; // CHANGE: Use totalCapacity as per schema

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price!: number; // Price per pet for this daycare session

  @IsEnum(DaycareSessionStatus) 
  @IsOptional()
  status?: DaycareSessionStatus; // Initial status, defaults to AVAILABLE
}
