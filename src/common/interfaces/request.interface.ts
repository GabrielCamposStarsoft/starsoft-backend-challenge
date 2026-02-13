import type { Optional } from '../types';
import type { IRequestUser } from './request-user.interface';

/**
 * @interface IRequest
 *
 * Represents an HTTP request type with an optional user field for authenticated requests,
 * and an optional generic extension for custom request-scoped data.
 *
 * @template T - Optional payload or custom fields attached to the request object.
 * @property user - The authenticated user from JWT, attached after authentication. Always present after guard validation.
 * @property data - Optional extension, provided by the generic type parameter.
 */
export interface IRequest<T = unknown> {
  /**
   * The authenticated user extracted from JWT.
   */
  user: IRequestUser;
  /**
   * Optional generic data attached to request.
   */
  data?: Optional<T>;
}
