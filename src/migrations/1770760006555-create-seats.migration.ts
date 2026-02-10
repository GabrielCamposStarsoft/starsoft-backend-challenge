import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeats1770760006555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "seats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "label" character varying(10) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'available',
        "version" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seats" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seats_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_seats_session_label"
      ON "seats" ("session_id", "label")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seats"`);
  }
}
