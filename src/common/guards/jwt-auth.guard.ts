/**
 * @fileoverview Guard for JWT access token authentication.
 *
 * Extends Passport's jwt strategy. Validates Bearer token, loads user,
 * and attaches to request. Throws UnauthorizedException with i18n message
 * when token is missing or invalid.
 *
 * @guard jwt-auth
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';
import type { Either, Nullable } from 'src/common';
import type { IRequestUser } from '../interfaces';

/**
 * Protects routes with JWT access token validation.
 *
 * @description Delegates to passport jwt strategy. On success, user is attached
 * to request; on failure, throws UnauthorizedException with translated message.
 *
 * @implements CanActivate
 */
@Injectable()
export class JwtAuthGuard
  extends PassportAuthGuard('jwt')
  implements CanActivate
{
  constructor(private readonly i18n: I18nService) {
    super();
  }

  /**
   * Delegates to passport strategy activation.
   *
   * @param context - Nest execution context
   * @returns Promise resolving to true if strategy succeeds
   */
  public override canActivate(
    context: ExecutionContext,
  ): Either<boolean, Promise<boolean>> {
    return super.canActivate(context) as Either<boolean, Promise<boolean>>;
  }

  /**
   * Handles passport strategy result: throws on error or missing user.
   *
   * @param err - Error from passport, if any
   * @param user - Resolved user or false if validation failed
   * @param _info - Optional strategy info (unused)
   * @returns The validated user
   * @throws {UnauthorizedException} When user is false/null or err is set
   */
  public override handleRequest<TUser = IRequestUser>(
    err: Nullable<Error>,
    user: Either<TUser, false>,
    _info: Nullable<Error>,
  ): TUser {
    if (err) {
      throw err;
      // End of guard logic if error encountered
    }
    if (user === false || user == null) {
      throw new UnauthorizedException(this.i18n.t('common.auth.required'));
    }
    return user;
  }
}
