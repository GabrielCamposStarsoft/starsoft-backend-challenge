/**
 * @fileoverview Migration to create the refresh_tokens table.
 *
 * @migration create-refresh-tokens-table
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the "refresh_tokens" table, its indexes, and constraints.
 */
export class CreateRefreshTokens1770760225946 implements MigrationInterface {
  /**
   * Runs the migration, creating the "refresh_tokens" table and associated indexes.
   *
   * @param {QueryRunner} queryRunner - The TypeORM QueryRunner for running the queries.
   * @returns {Promise<void>} A promise that resolves when the migration is complete.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
  }

  /**
   * Reverts the migration, dropping the "refresh_tokens" table if it exists.
   *
   * @param {QueryRunner} queryRunner - The TypeORM QueryRunner for running the queries.
   * @returns {Promise<void>} A promise that resolves when the migration is reverted.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
