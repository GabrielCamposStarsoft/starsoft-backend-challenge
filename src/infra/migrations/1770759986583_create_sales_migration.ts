/**
 * @fileoverview Migration to create the sales table.
 *
 * @migration create-sales-table
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the "sales" table.
 *
 * Table columns:
 *  - id: UUID, primary key, auto-generated.
 *  - reservation_id: UUID, references the reservation for the sale, not null, FK to "reservations".
 *  - session_id: UUID, references the session, not null, FK to "sessions".
 *  - seat_id: UUID, references the seat, not null, FK to "seats".
 *  - user_id: UUID, references the user who made the purchase, not null, FK to "users".
 *  - amount: Decimal (10,2), sale amount, not null.
 *  - created_at: Timestamp with time zone, record creation date, defaults to now.
 * Constraints:
 *  - PK: id
 *  - Unique: (seat_id, session_id) combination is unique to prevent double sales of the same seat in the same session.
 *  - FK: reservation_id -> reservations(id), ON DELETE RESTRICT
 *  - FK: session_id -> sessions(id), ON DELETE CASCADE
 *  - FK: seat_id -> seats(id), ON DELETE CASCADE
 *  - FK: user_id -> users(id), ON DELETE CASCADE
 * Indexes:
 *  - Index on user_id for efficient query by purchaser.
 */
export class CreateSales1770759986583 implements MigrationInterface {
  /**
   * Run the migration: create the "sales" table and add necessary constraints and indexes.
   * @param queryRunner The TypeORM QueryRunner instance for executing queries.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reservation_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "seat_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id"),
        CONSTRAINT "uq_sales_seat_session" UNIQUE ("seat_id", "session_id"),
        CONSTRAINT "FK_sales_reservation" FOREIGN KEY ("reservation_id")
          REFERENCES "reservations"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sales_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sales_seat" FOREIGN KEY ("seat_id")
          REFERENCES "seats"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sales_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sales_user_id" ON "sales" ("user_id")`,
    );
  }

  /**
   * Revert the migration: drops the "sales" table if it exists.
   * @param queryRunner The TypeORM QueryRunner instance for executing queries.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
  }
}
