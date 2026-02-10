/**
 * Environment variable keys for auth configuration.
 */
export const AUTH_ENV_KEYS = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRATION',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRATION',
} as const;
