import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { EitherMultiple, Optional } from '../types';

/**
 * Represents a HTTP Request object with an optional `user` property.
 *
 * @template User - The type of the user object attached to the request.
 */
interface IRequest<User> {
  user?: Optional<User>;
}

/**
 * Guard that determines if a request is authenticated based on the presence of a user.
 *
 * @template User - The type of the user object attached to the request.
 * @implements CanActivate
 */
export class AuthGuard<User = unknown> implements CanActivate {
  /**
   * Determines whether the current request is allowed to proceed based on user presence.
   *
   * @param context - The execution context providing access to the request.
   * @returns A boolean, Promise<boolean>, or Observable<boolean> indicating access permission.
   */
  public canActivate(
    context: ExecutionContext,
  ): EitherMultiple<[boolean, Promise<boolean>, Observable<boolean>]> {
    // Retrieve the HTTP request typed with the generic User.
    const request: IRequest<User> = context
      .switchToHttp()
      .getRequest<IRequest<User>>();

    // Return true only if a user is defined on the request.
    return request.user !== undefined;
  }
}
