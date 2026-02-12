/**
 * @fileoverview Guard for refresh token validation.
 *
 * Reads refreshToken from request body, validates via AuthService, attaches user.
 * Use on POST /auth/refresh. Throws UnauthorizedException when token missing/invalid.
 *
 * @guard jwt-refresh
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from '../services';
import type { UserEntity } from '../../users/entities';
import type { Optional, IRequestUser, IRequest } from 'src/common';
import type { IRequestWithRefreshToken } from '../interfaces';

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

  /**
   * Validates refresh token from body and attaches user to request.
   *
   * @param context - Nest execution context
   * @returns True if token valid and user attached
   * @throws {UnauthorizedException} When token missing or invalid
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: IRequestWithRefreshToken = context
      .switchToHttp()
      .getRequest<IRequestWithRefreshToken>();
    const refreshToken: Optional<string> = request.body?.refreshToken;

    if (refreshToken == null || typeof refreshToken !== 'string') {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.refreshRequired'),
      );
    }

    const user: UserEntity = await this.authService
      .validateRefreshToken(refreshToken)
      .catch(() => {
        throw new UnauthorizedException(
          this.i18n.t('common.auth.invalidOrExpiredToken'),
        );
      });

    const requestUser: IRequestUser = this.authService.getRequestUser(user);

    (request as IRequest<IRequestUser>).user = requestUser;
    return true;
  }
}
