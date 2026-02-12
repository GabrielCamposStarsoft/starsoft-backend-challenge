/**
 * @fileoverview Input interface for creating a user.
 *
 * @interface create-users-input
 */
import type { Optional, UserRole } from 'src/common';
export interface ICreateUsersInput {
  username: string;
  email: string;
  password: string;
  role: Optional<UserRole>;
}
