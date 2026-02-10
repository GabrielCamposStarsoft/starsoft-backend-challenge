import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria users, sessions e seats (ordem de timestamps exige tabelas base antes de reservations/sales).
 */
export class CreateUsers1770759945976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "idx_users_email_unique" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "sessions" (
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
    await queryRunner.query(`
      CREATE TABLE "seats" (
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
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_seats_session_label" ON "seats" ("session_id", "label")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
