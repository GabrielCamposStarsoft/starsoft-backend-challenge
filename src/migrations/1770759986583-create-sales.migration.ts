import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1770759986583 implements MigrationInterface {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
  }
}
