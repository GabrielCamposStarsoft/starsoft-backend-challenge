/**
 * @fileoverview Health check HTTP controller.
 *
 * Exposes GET /health for liveness/readiness probes (K8s, load balancers).
 * Excluded from throttling via ThrottlerSkipPathsGuard.
 *
 * @controller health-controller
 */

import { Controller, Get } from '@nestjs/common';

/**
 * Health check endpoint.
 *
 * @description Returns simple status for probes. Does not check DB or deps.
 */
@Controller()
export class HealthController {
  /**
   * Health check endpoint.
   * Returns a simple object indicating the service is up.
   *
   * @returns {{ status: string }} An object with 'ok' status.
   */
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
