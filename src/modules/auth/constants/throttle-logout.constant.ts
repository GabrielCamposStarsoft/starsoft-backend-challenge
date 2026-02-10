/**
 * Rate limit for logout: 20 requests per minute.
 */
export const THROTTLE_LOGOUT = { default: { limit: 20, ttl: 60_000 } };
