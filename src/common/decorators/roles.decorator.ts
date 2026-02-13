/**
 * @fileoverview Decorator for role-based access control.
 *
 * Stores required roles in handler metadata. RolesGuard reads this and
 * allows access only if the authenticated user has at least one of the roles.
 *
 * @decorator roles
 */

import { SetMetadata } from '@nestjs/common';
import type { UserRole } from 'src/common';
import { ROLES_KEY } from '../constants';

/**
 * Declares which roles are allowed to access a route.
 *
 * @description Use with RolesGuard. User must have at least one of the given roles.
 * Order of decorators matters: @Roles applies to the handler it annotates.
 *
 * @param roles - One or more UserRole values; access granted if user has any
 * @returns {MethodDecorator & ClassDecorator}
 *
 * @example
 * @Get('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * adminOnly() { return 'admin'; }
 */
export const Roles: (
  ...roles: Array<UserRole>
) => MethodDecorator & ClassDecorator = (
  ...roles: Array<UserRole>
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
