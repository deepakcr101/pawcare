// backend/src/activity-logs/dto/update-activity-log.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateActivityLogDto } from './create-activity-log.dto';
import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class UpdateActivityLogDto extends PartialType(CreateActivityLogDto) {
  // All properties from CreateActivityLogDto are inherited and made optional

  @IsString()
  @IsOptional()
  @MaxLength(500)
  details?: string;

  @IsEnum(ActivityType)
  @IsOptional()
  activityType?: ActivityType;
}