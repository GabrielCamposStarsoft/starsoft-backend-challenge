import type { IThrottleConfig } from '../interfaces';

/**
 * Rate limit for login: 5 requests per minute (mitigate brute force).
 */
export const THROTTLE_LOGIN: Record<string, IThrottleConfig> = {
  default: { limit: 5, ttl: 60_000 },
};
