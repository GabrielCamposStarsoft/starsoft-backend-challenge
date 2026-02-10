import type { Optional } from '../types';

/**
 * The contract for an HTTP request in the application,
 * which may optionally include an authenticated user.
 *
 * @template User - The type of the authenticated user object, if any.
 */
export interface IRequest<User> {
  /**
   * Optionally contains the authenticated user associated with the request.
   */
  user?: Optional<User>;
}
