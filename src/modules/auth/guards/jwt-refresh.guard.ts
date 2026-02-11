import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from '../services/auth.service';
import type { IRequestUser } from '../interfaces';
import type { UserEntity } from '../../users/entities/user.entity';
import { Optional } from 'src/common';

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
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: IRequestWithBody = context
      .switchToHttp()
      .getRequest<IRequestWithBody>();
    const refreshToken: Optional<string> = request.body?.refreshToken;

    if (refreshToken == null || typeof refreshToken !== 'string') {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.refreshRequired'),
      );
    }

    let user: UserEntity;
    try {
      user = await this.authService.validateRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidOrExpiredToken'),
      );
    }

    (request as { user: IRequestUser }).user =
      this.authService.getRequestUser(user);
    return true;
  }
}
