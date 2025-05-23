// backend/src/daycare-slots/daycare-sessions.controller.ts
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
  Request,
} from '@nestjs/common';
import { DaycareSessionsService } from './daycare-sessions.service'; // CHANGE: Import new service name
import { CreateDaycareSessionDto } from './dto/create-daycare-session.dto'; // CHANGE: Import new DTO name
import { UpdateDaycareSessionDto } from './dto/update-daycare-session.dto'; // CHANGE: Import new DTO name
import { DaycareSession, Role } from '@prisma/client'; // CHANGE: Import DaycareSession
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('daycare-sessions') // CHANGE: Controller path
@UseGuards(JwtAuthGuard)
export class DaycareSessionsController { // CHANGE: Rename controller class
  constructor(private readonly daycareSessionsService: DaycareSessionsService) {} // CHANGE: Service name

  // --- Admin-only endpoints ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body(ValidationPipe) createDaycareSessionDto: CreateDaycareSessionDto): Promise<DaycareSession> { // CHANGE: DTO & return type
    return this.daycareSessionsService.createDaycareSession(createDaycareSessionDto); // CHANGE: Service method
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body(ValidationPipe) updateDaycareSessionDto: UpdateDaycareSessionDto): Promise<DaycareSession> { // CHANGE: DTO & return type
    return this.daycareSessionsService.updateDaycareSession(id, updateDaycareSessionDto); // CHANGE: Service method
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.daycareSessionsService.removeDaycareSession(id); // CHANGE: Service method
  }

  // --- Endpoints for all authenticated users (OWNER, ADMIN, STAFF) ---
  @Get()
  async findAll(@Request() req): Promise<DaycareSession[]> { // CHANGE: Return type
    const userRole: Role = req.user.role;
    return this.daycareSessionsService.findAllDaycareSessions(userRole); // CHANGE: Service method
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<DaycareSession> { // CHANGE: Return type
    const userRole: Role = req.user.role;
    return this.daycareSessionsService.findOneDaycareSession(id, userRole); // CHANGE: Service method
  }
}