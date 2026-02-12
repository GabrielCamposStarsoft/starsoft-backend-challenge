/**
 * @fileoverview Input interface for signing an access token.
 *
 * @interface sign-access-token-input
 */
import type { UserRole } from 'src/common';
export interface ISignAccessTokenInput {
  userId: string;
  email: string;
  role: UserRole;
}
