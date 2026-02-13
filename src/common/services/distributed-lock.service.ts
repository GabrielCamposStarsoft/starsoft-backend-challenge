/**
 * @fileoverview Implements distributed locking using Redis and Redlock.
 *
 * Enables mutual exclusion for tasks across multiple process instances,
 * typically used by schedulers or distributed job handlers.
 *
 * @service distributed-lock
 */

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';
import Redlock, { CompatibleRedisClient, type Lock } from 'redlock';
import type { Optional } from '../types';

/**
 * Service for handling distributed locks backed by Redis using the Redlock algorithm.
 *
 * Allows safe acquisition and release of locks with TTL guarantees for multi-instance coordination.
 *
 * @class
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  /**
   * Instance of the Redlock distributed lock manager.
   * @type {Redlock}
   * @private
   */
  private readonly redlock: Redlock;

  /**
   * Holds locks currently acquired by this service, indexed by lock key.
   * @private
   * @type {Map<string, Lock>}
   */
  private readonly heldLocks: Map<string, Lock> = new Map<string, Lock>();

  /**
   * Initializes the distributed lock service with the given Redis client.
   * Sets up Redlock for lock coordination.
   *
   * @param {Redis} redis - Injected Redis client.
   */
  constructor(@Inject('REDIS') private readonly redis: Redis) {
    /**
     * Initialize Redlock with the Redis client.
     * @type {Redlock}
     */
    this.redlock = new Redlock(
      [this.redis as unknown as CompatibleRedisClient],
      {
        /**
         * Account for clock drift and Redis replication delays. Used by Redlock.
         * @type {number}
         */
        driftFactor: 0.01,
        /**
         * Number of attempts to retry acquiring the lock before failing.
         * @type {number}
         */
        retryCount: 0,
        /**
         * Milliseconds to wait between lock acquisition attempts.
         * @type {number}
         */
        retryDelay: 200,
        /**
         * Maximum milliseconds of randomized additional delay between retries.
         * @type {number}
         */
        retryJitter: 200,
      },
    );
  }

  /**
   * Acquire a distributed lock for a resource key with a specified TTL.
   * Returns true if lock was successfully acquired and stored, false if unavailable.
   *
   * @param {string} key - Unique identifier for the lock.
   * @param {number} ttlSeconds - Lock expiration in seconds.
   * @returns {Promise<boolean>} True if lock was acquired, false otherwise.
   */
  public async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const lock: Lock = await this.redlock.acquire([key], ttlSeconds * 1000);
      this.heldLocks.set(key, lock);
      return true;
    } catch {
      // Could not acquire lock, possibly already held by another instance.
      return false;
    }
  }

  /**
   * Release a distributed lock, if currently held, for the specified key.
   * Does nothing if the lock is not held by this instance.
   *
   * @param {string} key - Unique identifier for the lock to release.
   * @returns {Promise<void>} Resolves when release is complete.
   */
  public async release(key: string): Promise<void> {
    const lock: Optional<Lock> = this.heldLocks.get(key);
    if (lock == null) return;
    try {
      await lock.redlock.release(lock);
    } finally {
      this.heldLocks.delete(key);
    }
  }

  /**
   * Cleans up resources and connections during module destruction.
   * Closes internal Redlock connection to Redis.
   *
   * @returns {Promise<void>}
   */
  public async onModuleDestroy(): Promise<void> {
    await this.redlock.quit();
  }
}
