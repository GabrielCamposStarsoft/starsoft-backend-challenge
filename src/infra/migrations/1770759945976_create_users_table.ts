/**
 * @fileoverview Migration for users table.
 *
 * Creates the users table with username, email, password, role, and timestamps.
 * Email has unique constraint. Used by auth and user management.
 *
 * @migration create-users-table
 */

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the "users" table.
 *
 * @description Sessions and seats are created in their own migrations.
 */
export class CreateUsers1770759945976 implements MigrationInterface {
  /**
   * Runs the migration: creates the "users" table with required constraints.
   *
   * @param queryRunner - The TypeORM QueryRunner instance for executing queries.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "idx_users_email_unique" UNIQUE ("email")
      )
    `);
  }

  /**
   * Reverts the migration: drops the "users" table (if it exists).
   * @param queryRunner - The TypeORM QueryRunner instance for executing queries.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
