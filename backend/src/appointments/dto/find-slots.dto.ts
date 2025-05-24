// backend/src/appointments/dto/find-slots.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class FindSlotsDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsDateString() // YYYY-MM-DD
  @IsNotEmpty()
  date!: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;
}