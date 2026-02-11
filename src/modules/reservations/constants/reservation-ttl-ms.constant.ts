export const RESERVATION_TTL_MS: number = parseInt(
  process.env.RESERVATION_TTL_MS ?? '30000',
  10,
);
