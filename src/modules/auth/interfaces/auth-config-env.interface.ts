/**
 * @interface IAuthConfigEnv
 * @description
 * Interface representing the required environment variables for authentication configuration.
 */
/**
 * @property {string} JWT_SECRET - Secret key used to sign JWT tokens.
 * @property {string} JWT_ACCESS_EXPIRATION - Expiration time for JWT access tokens (e.g., '15m').
 * @property {string} JWT_REFRESH_EXPIRATION - Expiration time for JWT refresh tokens (e.g., '7d').
 */
export interface IAuthConfigEnv {
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
}
