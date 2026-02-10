/**
 * Rate limit for refresh token: 10 requests per minute.
 */
export const THROTTLE_REFRESH = { default: { limit: 10, ttl: 60_000 } };
