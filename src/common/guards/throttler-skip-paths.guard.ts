/**
 * @fileoverview Throttler guard with path-based exclusions.
 *
 * Extends ThrottlerGuard to skip rate limiting for specific paths
 * (e.g. health checks, API docs) without per-route @SkipThrottle.
 *
 * @guard throttler-skip-paths
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { IRequestWithUrl } from '../interfaces';
/**
 * Paths excluded from throttling.
 *
 * @description Exact match or prefix match (path.startsWith(skip + '/'))
 * applies. Used for health and docs so they are never rate limited.
 * @internal
 */
const SKIP_PATHS: Array<string> = ['/api-docs', '/health'];

@Injectable()
export class ThrottlerSkipPathsGuard
  extends ThrottlerGuard
  implements CanActivate
{
  /**
   * Skips throttling when path is in SKIP_PATHS or super.shouldSkip returns true.
   *
   * @param context - Nest execution context
   * @returns True if request should bypass throttling
   */
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (await super.shouldSkip(context)) {
      return true;
    }

    const request: IRequestWithUrl = context
      .switchToHttp()
      .getRequest<IRequestWithUrl>();

    const path = (request.url ?? '').split('?')[0];
    const shouldSkipPath = SKIP_PATHS.some(
      (skip) => path === skip || path.startsWith(`${skip}/`),
    );
    return shouldSkipPath;
  }
}
