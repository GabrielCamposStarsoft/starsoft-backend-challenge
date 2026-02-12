/**
 * @fileoverview Health check module.
 *
 * Registers HealthController at /health path.
 *
 * @module health
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [RouterModule.register([{ path: 'health', module: HealthModule }])],
  controllers: [HealthController],
})
export class HealthModule {}
