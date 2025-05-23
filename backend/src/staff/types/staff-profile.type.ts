// backend/src/staff/types/staff-profile.type.ts
import { Role } from '@prisma/client';

export type StaffProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};
