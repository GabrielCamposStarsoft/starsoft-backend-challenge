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
 * Guard that protects routes with JWT access token (Bearer).
 * Use on routes that require authentication.
 */
@Injectable()
export class JwtAuthGuard
  extends PassportAuthGuard('jwt')
  implements CanActivate
{
  constructor(private readonly i18n: I18nService) {
    super();
  }

  public override canActivate(
    context: ExecutionContext,
  ): Either<boolean, Promise<boolean>> {
    return super.canActivate(context) as Promise<boolean>;
  }

  public override handleRequest<TUser = IRequestUser>(
    err: Nullable<Error>,
    user: TUser | false,
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
