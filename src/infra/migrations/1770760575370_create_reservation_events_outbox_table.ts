/**
 * @fileoverview Migration for reservation outbox tables.
 *
 * Creates reservation_events_outbox (reservation.created) and
 * reservation_expiration_outbox (reservation.expired / seat.released).
 * Used for transactional outbox pattern to reliably publish events.
 *
 * @migration create-reservation-events-outbox
 */

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates reservation_events_outbox and reservation_expiration_outbox tables.
 */
export class CreateReservationEventsOutbox1770760575370 implements MigrationInterface {
  /**
   * Creates both outbox tables for reservation domain events.
   *
   * @param queryRunner - TypeORM QueryRunner
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reservation_events_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reservation_id" uuid NOT NULL,
        "seat_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservation_events_outbox" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "reservation_expiration_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reservation_id" uuid NOT NULL,
        "seat_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "seat_released" boolean NOT NULL DEFAULT true,
        "reason" character varying(20) NOT NULL DEFAULT 'expired',
        "published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservation_expiration_outbox" PRIMARY KEY ("id")
      )
    `);
  }

  /**
   * Drops both outbox tables (expiration first, then events).
   *
   * @param queryRunner - TypeORM QueryRunner
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "reservation_expiration_outbox"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "reservation_events_outbox"`);
  }
}
