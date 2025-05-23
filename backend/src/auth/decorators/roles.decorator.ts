import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Import the Role enum from Prisma client

export const ROLES_KEY = 'roles'; // A constant key to store metadata

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
