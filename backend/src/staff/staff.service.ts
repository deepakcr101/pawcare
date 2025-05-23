// backend/src/staff/staff.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { User, Role } from '@prisma/client'; // Import User and Role
import * as bcrypt from 'bcrypt';
import { StaffProfile } from './types/staff-profile.type';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createStaff(createStaffDto: CreateStaffDto): Promise<StaffProfile> {
    const { email, password, role, ...otherData } = createStaffDto;

    // Ensure the role is a valid staff role
    if (role !== Role.CLINIC_STAFF && role !== Role.GROOMER) {
      throw new BadRequestException('Only CLINIC_STAFF or GROOMER roles can be created via staff management.');
    }

    try {
      // Check if user with this email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      return this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role,
          ...otherData,
        },
        select: { // Select specific fields to return (hide password)
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          address: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating staff member:', error);
      throw new InternalServerErrorException('Failed to create staff member.');
    }
  }

  async findAllStaff(): Promise<StaffProfile[]> {
    try {
      return this.prisma.user.findMany({
        where: {
          OR: [
            { role: Role.CLINIC_STAFF },
            { role: Role.GROOMER },
          ],
        },
        select: { // Select specific fields for listing staff
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          address: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Error fetching staff members:', error);
      throw new InternalServerErrorException('Failed to fetch staff members.');
    }
  }

  async findOneStaff(id: string): Promise<StaffProfile>{
    try {
      const staff = await this.prisma.user.findUnique({
        where: { id },
        select: { // Select specific fields for staff details
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          address: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!staff || (staff.role !== Role.CLINIC_STAFF && staff.role !== Role.GROOMER)) {
        throw new NotFoundException(`Staff member with ID "${id}" not found.`);
      }
      return staff;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching staff member with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch staff member.');
    }
  }

  async updateStaff(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffProfile> {
    const { password, role, ...otherData } = updateStaffDto;

    try {
      // First, find the existing staff member to ensure they exist and have a staff role
      const existingStaff = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingStaff || (existingStaff.role !== Role.CLINIC_STAFF && existingStaff.role !== Role.GROOMER)) {
        throw new NotFoundException(`Staff member with ID "${id}" not found.`);
      }

      const dataToUpdate: any = { ...otherData };

      if (password) {
        dataToUpdate.passwordHash = await bcrypt.hash(password, 10); 
      }

      if (role && role !== Role.CLINIC_STAFF && role !== Role.GROOMER) {
        throw new BadRequestException('Cannot assign non-staff role via this endpoint.');
      }
      if (role) {
        dataToUpdate.role = role;
      }

      // Ensure email uniqueness if email is being updated
      if (updateStaffDto.email && updateStaffDto.email !== existingStaff.email) {
        const emailConflict = await this.prisma.user.findUnique({
          where: { email: updateStaffDto.email },
        });
        if (emailConflict && emailConflict.id !== id) {
          throw new ConflictException('Email already in use by another user.');
        }
      }

      return this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: { // Select specific fields to return (hide password)
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          address: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      console.error(`Error updating staff member with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update staff member.');
    }
  }

  async removeStaff(id: string): Promise<void> {
    try {
      // Ensure the user exists and is a staff member before deleting
      const existingStaff = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingStaff || (existingStaff.role !== Role.CLINIC_STAFF && existingStaff.role !== Role.GROOMER)) {
        throw new NotFoundException(`Staff member with ID "${id}" not found.`);
      }

      // Optional: Check for assigned appointments before deleting staff
      // You might want to prevent deletion if they have active appointments
      const assignedAppointments = await this.prisma.appointment.count({
        where: { staffId: id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      });

      if (assignedAppointments > 0) {
        // Option 1: Prevent deletion and throw error
        throw new BadRequestException('Cannot delete staff member with active or pending assigned appointments.');
        // Option 2: Reassign appointments to null or a default staff, then delete
        // await this.prisma.appointment.updateMany({
        //   where: { staffId: id },
        //   data: { staffId: null }, // Or assign to a "default" staff ID
        // });
      }

      // If no active appointments or re-assigned, proceed with deletion
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`Error deleting staff member with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete staff member.');
    }
  }
}