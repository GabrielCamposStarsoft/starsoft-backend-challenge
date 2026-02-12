/**
 * @fileoverview Session lifecycle status.
 *
 * @module session-status
 */

/**
 * Session status values.
 *
 * @enum {string}
 */
export enum SessionStatus {
  /** Session is active and accepting reservations. */
  ACTIVE = 'active',

  /** Session was cancelled. */
  CANCELLED = 'cancelled',

  /** Session has ended. */
  FINISHED = 'finished',
}
