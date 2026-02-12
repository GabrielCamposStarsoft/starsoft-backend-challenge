import type { UserRole } from 'src/common';

/**
 * Interface representing the payload embedded in the JWT access token.
 *
 * @interface IJwtAccessPayload
 * @property {string} sub - Subject identifier, usually the user's unique ID.
 * @property {string} email - The email address of the user.
 * @property {UserRole} role - The role assigned to the user.
 * @property {'access'} type - Token type, always 'access' for access tokens.
 */
export interface IJwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access';
}
