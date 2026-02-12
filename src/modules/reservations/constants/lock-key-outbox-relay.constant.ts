/**
 * @fileoverview Distributed lock key for the reservation outbox relay process.
 *
 * Ensures only one relay process for reservation outbox events is active at a time.
 *
 * @constant lock-key-outbox-relay
 */
export const LOCK_KEY_OUTBOX_RELAY: string = 'lock:reservation-outbox-relay';
