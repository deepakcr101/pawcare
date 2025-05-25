// backend/src/staff/staff.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { User, Role } from '@prisma/client';
import { StaffProfile } from './types/staff-profile.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator'; // Make sure this path is correct

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT first, then RolesGuard
@Roles(Role.ADMIN) // Only ADMINs can manage staff
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createStaffDto: CreateStaffDto):  Promise<StaffProfile>  {
    return this.staffService.createStaff(createStaffDto);
  }

  @Get()
  async findAll():  Promise<StaffProfile[]>  {
    return this.staffService.findAllStaff();
  }

  @Get(':id')
  async findOne(@Param('id') id: string):  Promise<StaffProfile>  {
    return this.staffService.findOneStaff(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateStaffDto: UpdateStaffDto):  Promise<StaffProfile>  {
    return this.staffService.updateStaff(id, updateStaffDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content for successful deletion
  async remove(@Param('id') id: string): Promise<void> {
    return this.staffService.removeStaff(id);
  }

  @Get('service/:serviceId')
@Roles(Role.OWNER, Role.ADMIN, Role.CLINIC_STAFF, Role.GROOMER) // Or just authenticated users
async findStaffForService(@Param('serviceId') serviceId: string): Promise<StaffProfile[]> {
  return this.staffService.findStaffByService(serviceId);
}

}