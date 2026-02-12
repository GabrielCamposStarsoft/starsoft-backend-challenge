/**
 * @fileoverview Abstract guard for checking request authentication.
 *
 * Generic guard that allows access only when request.user is defined.
 * Used as base or composition for route protection. Does not perform
 * JWT validation; assumes another layer (e.g. passport) sets user.
 *
 * @guard auth
 */

import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { EitherMultiple } from '../types';
import type { IRequest } from '../interfaces';

/**
 * Allows access only when request.user is defined.
 *
 * @description Does not throw; returns false if user is missing. Use after
 * a guard that validates tokens and attaches user (e.g. JwtAuthGuard).
 *
 * @template User - Type of user object on the request
 * @implements CanActivate
 */
export class AuthGuard<User = unknown> implements CanActivate {
  /**
   * Checks if the request has an authenticated user.
   *
   * @param context - Nest execution context for HTTP
   * @returns True if request.user is defined, false otherwise
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
