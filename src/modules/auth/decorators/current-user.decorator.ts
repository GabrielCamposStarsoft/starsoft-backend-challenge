import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { IRequestUser } from '../interfaces';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * Use on routes protected by JwtAuthGuard.
 *
 * @example
 * ```ts
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * me(@CurrentUser() user: IRequestUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator<IRequestUser>(
  (_data: unknown, ctx: ExecutionContext): IRequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: IRequestUser }>();
    return request.user;
  },
);
