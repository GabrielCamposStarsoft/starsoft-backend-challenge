import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { IRequestUser } from '../interfaces';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Request type with optional body containing refreshToken.
 */
interface IRequestWithBody {
  body?: { refreshToken?: string };
}

/**
 * Guard that validates the refresh token from the request body and attaches
 * the user to the request. Use on POST /auth/refresh.
 */
@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IRequestWithBody>();
    const refreshToken = request.body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    let user: UserEntity;
    try {
      user = await this.authService.validateRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    (request as { user: IRequestUser }).user = this.authService.getRequestUser(
      user,
    );
    return true;
  }
}
