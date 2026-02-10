import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { IRequestUser } from '../interfaces';

/**
 * Guard that protects routes with JWT access token (Bearer).
 * Use on routes that require authentication.
 */
@Injectable()
export class JwtAuthGuard
  extends PassportAuthGuard('jwt')
  implements CanActivate
{
  public override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  public override handleRequest<TUser = IRequestUser>(
    err: Error | null,
    user: TUser | false,
    _info: Error | null,
  ): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
