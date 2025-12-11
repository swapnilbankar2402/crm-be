// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's roles from JWT payload
    const userRoles = user.roles || [];

    // Check if user has at least one required role
    const hasRole = requiredRoles.some((requiredRole) =>
      userRoles.includes(requiredRole),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your roles: ${userRoles.join(', ')}`,
      );
    }

    return true;
  }
}