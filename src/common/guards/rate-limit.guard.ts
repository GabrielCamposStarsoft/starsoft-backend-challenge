import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { EitherMultiple } from '../types';
import type { Observable } from 'rxjs';
import type { IRequest } from '../interfaces';

/**
 * Guard that enforces rate limiting by allowing access
 * only if the request is associated with an authenticated user.
 *
 * @template User - The type of the authenticated user object, if any.
 * @implements {CanActivate}
 */
export class RateLimitGuard<User = unknown> implements CanActivate {
  /**
   * Determines whether the request can proceed based on presence of an authenticated user.
   *
   * @param {ExecutionContext} context - The current execution context.
   * @returns {EitherMultiple<[boolean, Promise<boolean>, Observable<boolean>]>} - True if the user exists, otherwise false.
   */
  public canActivate(
    context: ExecutionContext,
  ): EitherMultiple<[boolean, Promise<boolean>, Observable<boolean>]> {
    const request: IRequest<User> = context
      .switchToHttp()
      .getRequest<IRequest<User>>();
    // Allow only if there is a user associated with the request.
    return Boolean(request.user);
  }
}
