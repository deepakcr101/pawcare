import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client'; // Import Role enum
import { ROLES_KEY } from '../decorators/roles.decorator'; // Import metadata key

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user info from request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Check if user's role is among the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}

