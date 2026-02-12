/**
 * @fileoverview Default TTL for distributed locks.
 *
 * Used by DistributedLockInterceptor when no custom TTL is provided via
 * @DistributedLock. Lock auto-releases after this many seconds to prevent
 * deadlocks from crashed processes.
 *
 * @module distributed-lock-ttl
 */

/**
 * Default lock TTL in seconds.
 *
 * @description Locks expire automatically. Choose a value longer than
 * typical handler duration but short enough to recover from failures.
 *
 * @constant
 */
export const DISTRIBUTED_LOCK_TTL: number = 25;
