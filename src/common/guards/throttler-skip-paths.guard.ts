import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Paths that should not be rate limited (no controller with @SkipThrottle). */
const SKIP_PATHS: Array<string> = ['/api-docs', '/health'];

@Injectable()
export class ThrottlerSkipPathsGuard
  extends ThrottlerGuard
  implements CanActivate
{
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (await super.shouldSkip(context)) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const path = (request.url ?? '').split('?')[0];
    const shouldSkipPath = SKIP_PATHS.some(
      (skip) => path === skip || path.startsWith(`${skip}/`),
    );
    return shouldSkipPath;
  }
}
