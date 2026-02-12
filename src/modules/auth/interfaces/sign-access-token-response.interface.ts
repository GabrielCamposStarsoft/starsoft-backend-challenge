/**
 * @interface ISignAccessTokenOutput
 * @description
 * Represents the output structure after signing (issuing) an access token.
 *
 * @property {string} accessToken - The generated access token (JWT).
 * @property {number} expiresIn - The time until expiration, in milliseconds.
 */
export interface ISignAccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}
