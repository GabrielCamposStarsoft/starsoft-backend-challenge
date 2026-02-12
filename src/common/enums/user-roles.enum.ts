/**
 * @fileoverview User roles for authorization.
 *
 * Used by @Roles decorator and RolesGuard for RBAC.
 * Stored in user entity and JWT payload.
 *
 * @enum user-roles
 */

/**
 * User role identifiers.
 *
 * @enum {string}
 */
export enum UserRole {
  /** Administrator; full CRUD access to all resources. */
  ADMIN = 'admin',

  /** Standard user; restricted to own reservations and purchases. */
  USER = 'user',
}
