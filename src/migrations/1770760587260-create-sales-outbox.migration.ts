import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesOutbox1770760587260 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "processed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_outbox" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_outbox"`);
  }
}
