import type { IThrottleConfig } from '../interfaces';

/**
 * Rate limit for logout: 20 requests per minute.
 */
export const THROTTLE_LOGOUT: Record<string, IThrottleConfig> = {
  default: { limit: 20, ttl: 60_000 },
};
