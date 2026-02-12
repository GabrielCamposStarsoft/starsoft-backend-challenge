/**
 * @fileoverview Migration to drop the version column from reservations table.
 *
 * @migration drop-reservations-version-column
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to drop the version column from reservations table.
 *
 * The version column was used for optimistic locking but was not consistently
 * applied across use cases (ExpireReservationsUseCase uses manager.update() which
 * bypasses it). Concurrency is handled via pessimistic locking instead.
 */
export class DropReservationsVersionColumn1770923182891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN IF EXISTS "version"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD "version" integer NOT NULL DEFAULT 0`,
    );
  }
}
