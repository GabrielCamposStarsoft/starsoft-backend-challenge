/**
 * Response body for successful login.
 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Response body for successful token refresh.
 */
export interface IRefreshResponse {
  accessToken: string;
  expiresIn: number;
}
