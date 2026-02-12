import type { IAuthConfigEnv } from '../interfaces';

/**
 * @constant AUTH_ENV_KEYS
 * @description
 * Environment variable names used for authentication configuration.
 * Use with ConfigService.get(AUTH_ENV_KEYS.X, AUTH_DEFAULTS.X).
 *
 * @constant AUTH_DEFAULTS
 * @description
 * Default values when environment variables are not set.
 */
export const AUTH_ENV_KEYS: IAuthConfigEnv = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRATION',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRATION',
} as const;

export const AUTH_DEFAULTS: IAuthConfigEnv = {
  JWT_SECRET: 'tirulipa',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d',
} as const;
