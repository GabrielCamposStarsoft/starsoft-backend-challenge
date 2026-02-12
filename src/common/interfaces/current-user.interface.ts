/**
 * @fileoverview Request shape with authenticated user.
 *
 * Used when the request is guaranteed to have user (e.g. after JwtAuthGuard).
 *
 * @interface current-user
 */

import type { IRequestUser } from './request-user.interface';

/**
 * HTTP request with authenticated user.
 *
 * @description Extends Express/Fastify request with user set by auth guard.
 */
export interface ICurrentUser {
  /** The authenticated user from JWT. */
  user: IRequestUser;
}
