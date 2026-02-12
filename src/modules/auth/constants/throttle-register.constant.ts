import type { IThrottleConfig } from '../interfaces';

/**
 * Rate limit for register: 3 requests per hour per IP.
 */
export const THROTTLE_REGISTER: Record<string, IThrottleConfig> = {
  default: { limit: 3, ttl: 3_600_000 },
};
