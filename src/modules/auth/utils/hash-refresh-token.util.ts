import * as argon2 from 'argon2';

/**
 * Hashes a refresh token value for storage and lookup.
 * Used by CreateRefreshToken, ValidateRefreshToken and InvalidateRefreshToken use-cases.
 */
export async function hashRefreshToken(value: string): Promise<string> {
  return argon2.hash(value, { hashLength: 32 });
}
