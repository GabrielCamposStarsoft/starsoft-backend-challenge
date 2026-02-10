import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservationEventsOutbox1770760575370 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reservation_events_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reservationId" uuid NOT NULL,
        "seatId" uuid NOT NULL,
        "sessionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
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
        "published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservation_expiration_outbox" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "reservation_expiration_outbox"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "reservation_events_outbox"`);
  }
}
