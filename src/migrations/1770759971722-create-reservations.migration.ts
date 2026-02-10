import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservations1770759971722 implements MigrationInterface {
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
    await queryRunner.query(
      `CREATE INDEX "idx_reservations_status_expires" ON "reservations" ("status", "expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
  }
}
