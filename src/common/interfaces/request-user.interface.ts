/**
 * @fileoverview Authenticated user shape on the request.
 *
 * Attached by JwtAuthGuard after JWT validation. Available via @CurrentUser.
 *
 * @interface request-user
 */

import type { UserRole } from 'src/common';

/**
 * User data attached to request after JWT validation.
 */
export interface IRequestUser {
  /** User UUID from token sub claim. */
  id: string;

  /** User email from token. */
  email: string;

  /** User role for RBAC. */
  role: UserRole;
}
