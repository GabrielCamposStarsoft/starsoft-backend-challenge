import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import Redlock, { CompatibleRedisClient, type Lock } from 'redlock';
import type { Optional } from '../types';

/**
 * @class DistributedLockService
 * @description
 * Provides distributed locking using the Redlock algorithm with Redis as a backend.
 * Handles acquiring and releasing locks in a distributed system, ensuring mutual exclusion.
 */
@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  /**
   * The Redis client instance used for Redlock coordination.
   * @private
   * @type {Redis}
   */
  private readonly redis: CompatibleRedisClient;

  /**
   * The Redlock instance for distributed locking.
   * @private
   * @type {Redlock}
   */
  private readonly redlock: Redlock;

  /**
   * In-memory map of currently held locks, indexed by lock key.
   * @private
   * @type {Map<string, Lock>}
   */
  private readonly heldLocks: Map<string, Lock> = new Map<string, Lock>();

  /**
   * Creates an instance of DistributedLockService.
   * @param {ConfigService} config - Service to retrieve config such as the Redis connection URI.
   */
  constructor(private readonly config: ConfigService) {
    const url: string =
      this.config.get<string>('VALKEY_URL') ?? 'redis://localhost:6379';
    this.redis = new Redis(url) as unknown as CompatibleRedisClient;
    this.redlock = new Redlock([this.redis], {
      /**
       * The expected clock drift for Redis (useful for correct expiration).
       * @type {number}
       */
      driftFactor: 0.01,

      /**
       * Number of retry attempts to acquire the lock before failing.
       * @type {number}
       */
      retryCount: 0,

      /**
       * Delay between lock acquire retries (ms).
       * @type {number}
       */
      retryDelay: 200,

      /**
       * Jitter for lock acquire retry delay (ms).
       * @type {number}
       */
      retryJitter: 200,

      /**
       * Threshold before expiration to auto-extend the lock (ms).
       * @type {number}
       */
    });
  }

  /**
   * Attempts to acquire a distributed lock with the specified key and TTL.
   * If acquired, the lock is stored and `true` is returned.
   * If acquisition fails (lock held elsewhere), returns `false`.
   *
   * @param {string} key - The unique key representing the lock resource.
   * @param {number} ttlSeconds - The time-to-live for the lock in seconds.
   * @returns {Promise<boolean>} Promise resolving to `true` if the lock was acquired, otherwise `false`.
   */
  public async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const lock: Lock = await this.redlock.acquire([key], ttlSeconds * 1000);
      this.heldLocks.set(key, lock);
      return true;
    } catch {
      // Lock could not be acquired (already held elsewhere, or error)
      return false;
    }
  }

  /**
   * Releases a lock previously acquired by this instance for the specified key.
   * If the lock is not held by this instance, this operation does nothing.
   *
   * @param {string} key - The key of the lock to release.
   * @returns {Promise<void>} Promise that resolves when the release action completes.
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
   * Handles cleanup logic on shutdown/module destroy lifecycle event.
   * Closes the underlying Redlock (and Redis) connection.
   *
   * @returns {Promise<void>} Promise indicating completion of shutdown cleanup.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.redlock.quit();
  }
}
