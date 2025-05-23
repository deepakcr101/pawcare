// backend/src/daycare-bookings/daycare-bookings.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDaycareBookingDto } from './dto/create-daycare-booking.dto';
import { UpdateDaycareBookingDto } from './dto/update-daycare-booking.dto';
import { DaycareBooking, DaycareBookingStatus, DaycareSessionStatus, Role } from '@prisma/client';

@Injectable()
export class DaycareBookingsService {
  constructor(private prisma: PrismaService) {}

  async createDaycareBooking(createDaycareBookingDto: CreateDaycareBookingDto, userId: string): Promise<DaycareBooking> {
    const { daycareSessionId, petId, roomId, status } = createDaycareBookingDto;

    try {
      // 1. Verify DaycareSession exists and has capacity
      const session = await this.prisma.daycareSession.findUnique({
        where: { id: daycareSessionId },
      });

      if (!session) {
        throw new NotFoundException(`Daycare session with ID "${daycareSessionId}" not found.`);
      }

      if (session.status === DaycareSessionStatus.CLOSED || session.currentBookings >= session.totalCapacity) {
        throw new BadRequestException(`Daycare session for ${session.date.toDateString()} is full or closed.`);
      }

      // 2. Verify pet belongs to the user
      const pet = await this.prisma.pet.findUnique({
        where: { id: petId },
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID "${petId}" not found.`);
      }
      if (pet.ownerId !== userId) {
        throw new ForbiddenException(`Pet with ID "${petId}" does not belong to the authenticated user.`);
      }

      // 3. Check if this pet is already booked for this session
      const existingBooking = await this.prisma.daycareBooking.findFirst({
        where: {
          petId,
          daycareSessionId,
          status: {
            notIn: [DaycareBookingStatus.CANCELLED, DaycareBookingStatus.CHECKED_OUT],
          },
        },
      });

      if (existingBooking) {
        throw new ConflictException(`Pet "${pet.name}" is already booked for this daycare session.`);
      }

      // 4. If roomId is provided, verify it exists and has capacity (optional, depends on how detailed room management is)
      if (roomId) {
        const room = await this.prisma.daycareRoom.findUnique({
          where: { id: roomId },
          include: { daycareSlots: true }, // Include existing bookings for capacity check
        });
        if (!room) {
          throw new NotFoundException(`Daycare room with ID "${roomId}" not found.`);
        }
        // This is a basic check; sophisticated room capacity would need more logic (e.g., per session)
        // For now, we'll assume room capacity is just a general guideline or for future use.
        // If room capacity per session is crucial, you'd need a way to track it.
      }


      // Start a transaction to ensure both booking creation and session update are atomic
      const newBooking = await this.prisma.$transaction(async (prisma) => {
        const booking = await prisma.daycareBooking.create({
          data: {
            daycareSessionId,
            petId,
            roomId,
            status: status || DaycareBookingStatus.BOOKED,
          },
        });

        // Increment currentBookings on the DaycareSession
        await prisma.daycareSession.update({
          where: { id: daycareSessionId },
          data: {
            currentBookings: {
              increment: 1,
            },
            // Optionally, if currentBookings reaches totalCapacity, set status to FULL
            status: {
              // This is a more complex update that might require raw queries or multiple steps
              // For simplicity, we'll let a separate check or cron job handle setting to FULL
              // or handle it in the next step
            },
          },
        });

        return booking;
      });

      return newBooking;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException ||
          error instanceof ForbiddenException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error creating daycare booking:', error);
      throw new InternalServerErrorException('Failed to create daycare booking.');
    }
  }

  async findAllDaycareBookings(userRole: Role, userId?: string): Promise<DaycareBooking[]> {
    const whereClause: any = {};

    // Owners should only see their own bookings
    if (userRole === Role.OWNER && userId) {
      whereClause.pet = {
        ownerId: userId,
      };
    }

    try {
      return this.prisma.daycareBooking.findMany({
        where: whereClause,
        include: {
          pet: true, // Include pet details
          daycareSession: true, // Include session details
          room: true, // Include room details if any
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching daycare bookings:', error);
      throw new InternalServerErrorException('Failed to fetch daycare bookings.');
    }
  }

  async findOneDaycareBooking(id: string, userId: string, userRole: Role): Promise<DaycareBooking> {
    try {
      const booking = await this.prisma.daycareBooking.findUnique({
        where: { id },
        include: {
          pet: true,
          daycareSession: true,
          room: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Daycare booking with ID "${id}" not found.`);
      }

      // Owners can only view their own bookings
      if (userRole === Role.OWNER && booking.pet.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to view this daycare booking.');
      }

      return booking;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error fetching daycare booking with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch daycare booking.');
    }
  }

  async updateDaycareBooking(id: string, updateDaycareBookingDto: UpdateDaycareBookingDto, userId: string, userRole: Role): Promise<DaycareBooking> {
    const { status, roomId } = updateDaycareBookingDto;

    try {
      const existingBooking = await this.prisma.daycareBooking.findUnique({
        where: { id },
        include: { pet: true, daycareSession: true },
      });

      if (!existingBooking) {
        throw new NotFoundException(`Daycare booking with ID "${id}" not found.`);
      }

      // Owners can only update status to CANCELLED or update room (if allowed)
      if (userRole === Role.OWNER) {
        if (status && status !== DaycareBookingStatus.CANCELLED) {
          throw new ForbiddenException('Owners can only cancel their own daycare bookings.');
        }
        if (existingBooking.pet.ownerId !== userId) {
            throw new ForbiddenException('You do not have permission to update this daycare booking.');
        }
        // Prevent cancellation if checked-in/out
        if (existingBooking.status === DaycareBookingStatus.CHECKED_IN || existingBooking.status === DaycareBookingStatus.CHECKED_OUT) {
          throw new BadRequestException('Cannot cancel a checked-in or checked-out booking.');
        }
      }

      // If status is changing to CANCELLED from a non-cancelled/checked-out state, decrement session bookings
      const decrementSession = (
        status === DaycareBookingStatus.CANCELLED &&
        existingBooking.status !== DaycareBookingStatus.CANCELLED &&
        existingBooking.status !== DaycareBookingStatus.CHECKED_OUT
      );

      // If status is changing to CHECKED_IN from BOOKED/CANCELLED, check session capacity first
      const incrementSession = (
        status === DaycareBookingStatus.CHECKED_IN &&
        (existingBooking.status === DaycareBookingStatus.BOOKED || existingBooking.status === DaycareBookingStatus.CANCELLED)
      );

      // If status is changing from CHECKED_IN to CHECKED_OUT, decrement session bookings
      const decrementOnCheckout = (
        status === DaycareBookingStatus.CHECKED_OUT &&
        existingBooking.status === DaycareBookingStatus.CHECKED_IN
      );

      return this.prisma.$transaction(async (prisma) => {
        if (decrementSession) {
          await prisma.daycareSession.update({
            where: { id: existingBooking.daycareSessionId },
            data: { currentBookings: { decrement: 1 } },
          });
        }
        // Re-increment if status is changed from CANCELLED back to BOOKED (e.g., admin re-booking)
        // or if it was incremented initially and now needs to be decremented.
        // This logic can get tricky; for simplicity, we focus on decrementing on cancellation.
        // For check-in, the count was already incremented at initial booking.

        if (roomId) {
            const room = await prisma.daycareRoom.findUnique({ where: { id: roomId } });
            if (!room) {
                throw new NotFoundException(`Daycare room with ID "${roomId}" not found.`);
            }
        }

        const updatedBooking = await prisma.daycareBooking.update({
          where: { id },
          data: {
            status,
            roomId,
          },
        });

        // After updating the booking status, you might want to adjust session status if needed.
        // Example: If a session becomes FULL, update its status.
        // This is typically handled by a cron job or a more complex trigger.

        return updatedBooking;
      });

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error updating daycare booking with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update daycare booking.');
    }
  }

  async removeDaycareBooking(id: string, userId: string, userRole: Role): Promise<void> {
    try {
      const existingBooking = await this.prisma.daycareBooking.findUnique({
        where: { id },
        include: { pet: true },
      });

      if (!existingBooking) {
        throw new NotFoundException(`Daycare booking with ID "${id}" not found.`);
      }

      // Owners can only delete their own bookings if they are BOOKED and not CHECKED_IN/OUT
      if (userRole === Role.OWNER) {
        if (existingBooking.pet.ownerId !== userId) {
          throw new ForbiddenException('You do not have permission to delete this daycare booking.');
        }
        if (existingBooking.status !== DaycareBookingStatus.BOOKED) {
          throw new BadRequestException('Only pending (BOOKED) daycare bookings can be deleted by owners. Please use "cancel" for other statuses.');
        }
      }

      // If the booking is not already cancelled or checked out, decrement the session's current bookings
      const decrementSession = (
        existingBooking.status !== DaycareBookingStatus.CANCELLED &&
        existingBooking.status !== DaycareBookingStatus.CHECKED_OUT
      );

      await this.prisma.$transaction(async (prisma) => {
        if (decrementSession) {
          await prisma.daycareSession.update({
            where: { id: existingBooking.daycareSessionId },
            data: { currentBookings: { decrement: 1 } },
          });
        }

        await prisma.daycareBooking.delete({
          where: { id },
        });
      });

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error deleting daycare booking with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete daycare booking.');
    }
  }
}