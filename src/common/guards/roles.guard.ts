/**
 * @fileoverview Guard for role-based access control.
 *
 * Reads required roles from @Roles metadata and allows access only if
 * the authenticated user has at least one of those roles.
 *
 * @guard roles
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IRequest, IRequestUser, UserRole } from 'src/common';
import { ROLES_KEY } from 'src/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Checks if user's role matches any of the required roles.
   *
   * @param context - Nest execution context
   * @returns True if no @Roles metadata, or user has at least one required role
   */
  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles: Array<UserRole> = this.reflector.getAllAndOverride<
      Array<UserRole>
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (requiredRoles == null) {
      return true;
    }
    const { user }: IRequest<IRequestUser> = context
      .switchToHttp()
      .getRequest<IRequest<IRequestUser>>();

    return requiredRoles.some((role: UserRole) => user?.role === role);
  }
}
