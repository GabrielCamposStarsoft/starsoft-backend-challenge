import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessions1770760018543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "movie_title" character varying(255) NOT NULL,
        "room_name" character varying(100) NOT NULL,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ticket_price" numeric(10,2) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
  }
}
