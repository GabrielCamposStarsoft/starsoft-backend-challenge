/**
 * Rate limit for login: 5 requests per minute (mitigate brute force).
 */
export const THROTTLE_LOGIN = { default: { limit: 5, ttl: 60_000 } };
