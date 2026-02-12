/**
 * @fileoverview Metadata key for role-based access control.
 *
 * Used by @Roles decorator and RolesGuard to store required roles
 * on route handlers. Guard compares request user roles against this.
 *
 * @module roles-key
 */

/**
 * Metadata key under which required roles are stored.
 *
 * @description Value is an array of role identifiers (e.g. UserRole enum values).
 *
 * @constant
 */
export const ROLES_KEY: string = 'roles';
