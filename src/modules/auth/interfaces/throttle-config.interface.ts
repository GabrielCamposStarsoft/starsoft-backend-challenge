/**
 * @interface IThrottleConfig
 * @description
 * Interface representing a throttle configuration.
 *
 * @property {number} limit - Maximum number of requests allowed within the ttl period.
 * @property {number} ttl - Time to live (in milliseconds) for the rate limit window.
 * limit: Maximum number of requests allowed within the ttl period.
 * ttl: Time to live (in milliseconds) for the rate limit window.
 */
export interface IThrottleConfig {
  limit: number;
  ttl: number;
}
