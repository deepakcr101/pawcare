// backend/src/daycare-slots/daycare-sessions.service.ts (RENAMED FILE)
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDaycareSessionDto } from './dto/create-daycare-session.dto'; // CHANGE DTO import
import { UpdateDaycareSessionDto } from './dto/update-daycare-session.dto'; // CHANGE DTO import
import { DaycareSession, DaycareSessionStatus, Role } from '@prisma/client'; // CHANGE DaycareSlot to DaycareSession, DaycareStatus to DaycareSessionStatus

@Injectable()
export class DaycareSessionsService { // CHANGE: Rename service class
  constructor(private prisma: PrismaService) {}

  async createDaycareSession(createDaycareSessionDto: CreateDaycareSessionDto): Promise<DaycareSession> { // CHANGE: Rename method & DTO
    const { date, totalCapacity, price, status } = createDaycareSessionDto; // CHANGE: totalCapacity

    const sessionDate = new Date(date);

    try {
      // Check if a daycare session already exists for this date
      const existingSession = await this.prisma.daycareSession.findUnique({ // CHANGE: daycareSlot to daycareSession
        where: { date: sessionDate },
      });

      if (existingSession) {
        throw new ConflictException(`Daycare session for date ${date} already exists.`);
      }

      return this.prisma.daycareSession.create({ // CHANGE: daycareSlot to daycareSession
        data: {
          date: sessionDate,
          totalCapacity, // CHANGE: totalCapacity
          price,
          status: status || DaycareSessionStatus.AVAILABLE, // CHANGE: DaycareSessionStatus
          currentBookings: 0, // Initialize current bookings to 0
        },
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating daycare session:', error);
      throw new InternalServerErrorException('Failed to create daycare session.');
    }
  }

  async findAllDaycareSessions(userRole: Role): Promise<DaycareSession[]> { // CHANGE: Method & Return type
    try {
      const whereClause: any = {};

      if (userRole === Role.OWNER) {
        whereClause.status = { not: DaycareSessionStatus.CLOSED }; // CHANGE: DaycareSessionStatus
        whereClause.totalCapacity = { gt: 0 }; // CHANGE: totalCapacity
        whereClause.currentBookings = { lt: this.prisma.daycareSession.fields.totalCapacity }; // Only show if not full
      }

      return this.prisma.daycareSession.findMany({ // CHANGE: daycareSlot to daycareSession
        where: whereClause,
        orderBy: { date: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching daycare sessions:', error);
      throw new InternalServerErrorException('Failed to fetch daycare sessions.');
    }
  }

  async findOneDaycareSession(id: string, userRole: Role): Promise<DaycareSession> { // CHANGE: Method & Return type
    try {
      const session = await this.prisma.daycareSession.findUnique({ // CHANGE: daycareSlot to daycareSession
        where: { id },
      });

      if (!session) {
        throw new NotFoundException(`Daycare session with ID "${id}" not found.`);
      }

      if (userRole === Role.OWNER) {
        if (session.status === DaycareSessionStatus.CLOSED || session.currentBookings >= session.totalCapacity) { // CHANGE: DaycareSessionStatus, totalCapacity
          throw new NotFoundException('Daycare session not available for booking.');
        }
      }

      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching daycare session with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch daycare session.');
    }
  }

  async updateDaycareSession(id: string, updateDaycareSessionDto: UpdateDaycareSessionDto): Promise<DaycareSession> { // CHANGE: Method & DTO
    const { newDate, totalCapacity, price, status } = updateDaycareSessionDto; // CHANGE: totalCapacity, remove `date` (it's in newDate)

    try {
      const existingSession = await this.prisma.daycareSession.findUnique({ // CHANGE: daycareSlot to daycareSession
        where: { id },
      });

      if (!existingSession) {
        throw new NotFoundException(`Daycare session with ID "${id}" not found.`);
      }

      const dataToUpdate: any = {};

      if (newDate) {
        const parsedNewDate = new Date(newDate);
        const conflictSession = await this.prisma.daycareSession.findUnique({ // CHANGE: daycareSlot to daycareSession
          where: { date: parsedNewDate },
        });

        if (conflictSession && conflictSession.id !== id) {
          throw new ConflictException(`Daycare session for date ${newDate} already exists.`);
        }
        dataToUpdate.date = parsedNewDate;
      }

      if (totalCapacity !== undefined) { // CHANGE: totalCapacity
        if (totalCapacity < existingSession.currentBookings) {
          throw new BadRequestException(`New capacity (<span class="math-inline">\{totalCapacity\}\) cannot be less than current bookings \(</span>{existingSession.currentBookings}).`);
        }
        dataToUpdate.totalCapacity = totalCapacity; // CHANGE: totalCapacity
      }

      if (price !== undefined) {
        dataToUpdate.price = price;
      }

      if (status !== undefined) {
        dataToUpdate.status = status;
        // No direct adjustment of currentBookings or totalCapacity based on FULL status here
        // because `currentBookings` is managed by actual bookings.
      }

      return this.prisma.daycareSession.update({ // CHANGE: daycareSlot to daycareSession
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error updating daycare session with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update daycare session.');
    }
  }

  async removeDaycareSession(id: string): Promise<void> { // CHANGE: Method name
    try {
      const existingSession = await this.prisma.daycareSession.findUnique({ // CHANGE: daycareSlot to daycareSession
        where: { id },
      });

      if (!existingSession) {
        throw new NotFoundException(`Daycare session with ID "${id}" not found.`);
      }

      // Prevent deletion if there are any active bookings for this session
      const activeBookings = await this.prisma.daycareBooking.count({ // CHANGE: daycareBooking (access the new model)
        where: { daycareSessionId: id }, // CHANGE: daycareSlotId to daycareSessionId
      });

      if (activeBookings > 0) {
        throw new BadRequestException('Cannot delete daycare session with existing bookings.');
      }

      await this.prisma.daycareSession.delete({ // CHANGE: daycareSlot to daycareSession
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error deleting daycare session with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete daycare session.');
    }
  }
}