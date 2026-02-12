/**
 * @fileoverview Parameter decorator for extracting the authenticated user.
 *
 * Reads the user object attached by JwtAuthGuard/JwtStrategy onto the request.
 * Only valid on routes protected by JwtAuthGuard; otherwise request.user may be undefined.
 *
 * @decorator current-user
 */

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ICurrentUser, IRequestUser } from '../interfaces';

/**
 * Extracts the authenticated user from the request.
 *
 * @description Use on route parameters in handlers protected by JwtAuthGuard.
 * Returns the same object that was set by the JWT strategy (sub, email, roles, etc.).
 *
 * @param _data - Unused; parameter decorators receive optional metadata.
 * @param ctx - Nest execution context for HTTP requests.
 * @returns {IRequestUser} The user attached to the request by the auth guard.
 *
 * @example
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * me(@CurrentUser() user: IRequestUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator<IRequestUser>(
  (_data: unknown, ctx: ExecutionContext): IRequestUser => {
    const request: ICurrentUser = ctx.switchToHttp().getRequest<ICurrentUser>();
    return request.user;
  },
);
