/**
 * @fileoverview Utility for hashing refresh tokens.
 *
 * Uses argon2 for secure hashing. Used for storage and lookup of refresh tokens.
 *
 * @util hash-refresh-token
 */
import { hash as argon2Hash } from 'argon2';

/**
 * Hashes a refresh token value for storage and lookup in the system.
 * This function utilizes the argon2 hashing algorithm with a hash length of 32.
 *
 * @param {string} value - The plain refresh token value to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed refresh token.
 *
 * @example
 * const hashed = await hashRefreshToken('plainToken123');
 */
export const hashRefreshToken: (value: string) => Promise<string> = async (
  value: string,
): Promise<string> => {
  return await argon2Hash(value, { hashLength: 32 });
};
