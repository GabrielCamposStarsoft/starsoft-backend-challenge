/**
 * @fileoverview Migration to create the reservations table.
 *
 * @migration create-reservations-table
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the "reservations" table, which stores seat reservations for sessions.
 *
 * Table columns:
 *  - id: UUID, primary key, auto-generated.
 *  - session_id: UUID, references the session being reserved, not null, FK to "sessions".
 *  - seat_id: UUID, references the seat being reserved, not null, FK to "seats".
 *  - user_id: UUID, references the user who made the reservation, not null, FK to "users".
 *  - status: String (varchar 20), reservation status (e.g. pending, confirmed, cancelled), defaults to 'pending'.
 *  - expires_at: Timestamp with time zone, when reservation is considered expired, not null.
 *  - created_at: Timestamp with time zone, record creation date, defaults to now.
 *  - updated_at: Timestamp with time zone, last update date, defaults to now.
 *  - version: Integer, version for optimistic locking, defaults to 0.
 * Constraints:
 *  - PK: id
 *  - FK: session_id -> sessions(id), ON DELETE CASCADE
 *  - FK: seat_id -> seats(id), ON DELETE CASCADE
 *  - FK: user_id -> users(id), ON DELETE CASCADE
 * Indexes:
 *  - Composite index on (status, expires_at) for fast status/expiration queries.
 *  - Partial unique index on (seat_id, session_id) WHERE status = 'pending' (prevents double reservation for the same seat in a session while pending)
 */
export class CreateReservations1770759971722 implements MigrationInterface {
  /**
   * Run the migration: create the "reservations" table and add necessary constraints and indexes.
   * @param queryRunner The TypeORM QueryRunner for running queries.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "seat_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "version" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservations_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_seat" FOREIGN KEY ("seat_id")
          REFERENCES "seats"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Composite index for status/expiration queries
    await queryRunner.query(
      `CREATE INDEX "idx_reservations_status_expires" ON "reservations" ("status", "expires_at")`,
    );

    // Partial unique index to prevent duplicate 'pending' reservations for the same seat in same session
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_reservations_active_seat" ON "reservations" ("seat_id", "session_id") WHERE status = 'pending'`,
    );
  }

  /**
   * Revert the migration: drops the "reservations" table and custom indexes if they exist.
   * @param queryRunner The TypeORM QueryRunner for running queries.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up indexes (drop in correct order due to dependency, if any)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_reservations_active_seat"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_reservations_status_expires"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
  }
}
