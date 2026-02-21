/** Maximum number of relay attempts before giving up. */
export const MAX_RETRY_COUNT: number = 10;

/** Base delay in ms for the first retry (matches scheduler interval). */
export const BASE_RETRY_DELAY_MS: number = 30_000;

/** Maximum delay in ms between retries (cap at 1 hour). */
export const MAX_RETRY_DELAY_MS: number = 3_600_000;
