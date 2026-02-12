/**
 * @fileoverview Metadata key for distributed lock decorator.
 *
 * Used by @DistributedLock decorator and DistributedLockInterceptor to store
 * the lock key template in handler metadata. Interceptor reads this to acquire
 * Redis locks before executing the handler.
 *
 * @module distributed-lock-key
 */

/**
 * Metadata key under which the lock key template is stored.
 *
 * @description Value stored is typically a string template (e.g. "reservation:{id}")
 * that the interceptor resolves using request params/body.
 *
 * @constant
 */
export const DISTRIBUTED_LOCK_KEY: string = 'distributed_lock:key';
