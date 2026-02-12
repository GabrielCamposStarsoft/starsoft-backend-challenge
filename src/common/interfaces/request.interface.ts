/**
 * @fileoverview HTTP request contract with optional user.
 *
 * Generic shape for guards and interceptors that access request.user.
 *
 * @interface request
 */

import type { Optional } from '../types';

/**
 * HTTP request with optional authenticated user.
 *
 * @template User - Type of user object when authenticated
 */
export interface IRequest<User = unknown> {
  /** Authenticated user, set by auth guard when JWT is valid. */
  user?: Optional<User>;
}
