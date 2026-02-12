/**
 * Number of outbox events to process per batch.
 * @constant
 * @type {number}
 */
export const BATCH_SIZE: number = 50;

/**
 * Outbox event name for payment confirmation.
 * @constant
 * @type {string}
 */
export const OUTBOX_EVENT_PAYMENT_CONFIRMED: string = 'PaymentConfirmed';
