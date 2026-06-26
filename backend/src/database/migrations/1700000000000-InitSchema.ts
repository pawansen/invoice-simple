import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: users, customers, invoices, invoice_items.
 *
 * Creates the persisted invoice status enum (Draft/Pending/Paid only — Overdue
 * is derived and never stored), all foreign keys, unique constraints, indexes
 * backing the list screen's search/filter/sort, and CHECK constraints mirroring
 * the business validation rules.
 */
export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Required for uuid generation (gen_random_uuid is provided by pgcrypto).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // --- enum: persisted invoice statuses ---
    await queryRunner.query(
      `CREATE TYPE "invoices_status_enum" AS ENUM ('Draft', 'Pending', 'Paid')`,
    );

    // --- users ---
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
        "email"         varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "fullname"      varchar(255) NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")`,
    );

    // --- customers ---
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
        "fullname"      varchar(255) NOT NULL,
        "email"         varchar(255) NOT NULL,
        "mobile_number" varchar(50),
        "address"       varchar(500),
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_customers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_customers_fullname" ON "customers" ("fullname")`,
    );

    // --- invoices ---
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id"                uuid        NOT NULL DEFAULT gen_random_uuid(),
        "invoice_number"    varchar(100) NOT NULL,
        "invoice_reference" varchar(100),
        "invoice_date"      date        NOT NULL,
        "due_date"          date        NOT NULL,
        "currency"          varchar(3)  NOT NULL,
        "currency_symbol"   varchar(10) NOT NULL,
        "description"       varchar(1000),
        "status"            "invoices_status_enum" NOT NULL DEFAULT 'Draft',
        "invoice_sub_total" numeric(14,2) NOT NULL,
        "total_tax"         numeric(14,2) NOT NULL,
        "total_discount"    numeric(14,2) NOT NULL DEFAULT 0,
        "total_amount"      numeric(14,2) NOT NULL,
        "total_paid"        numeric(14,2) NOT NULL DEFAULT 0,
        "balance_amount"    numeric(14,2) NOT NULL,
        "customer_id"       uuid        NOT NULL,
        "created_by"        uuid        NOT NULL,
        "created_at"        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "chk_invoices_due_after_invoice" CHECK ("due_date" >= "invoice_date"),
        CONSTRAINT "chk_invoices_non_negative" CHECK (
          "invoice_sub_total" >= 0 AND "total_tax" >= 0 AND "total_discount" >= 0
          AND "total_amount" >= 0 AND "total_paid" >= 0
        ),
        CONSTRAINT "fk_invoices_customer" FOREIGN KEY ("customer_id")
          REFERENCES "customers" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_invoices_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_invoices_invoice_number" ON "invoices" ("invoice_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_status" ON "invoices" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_invoice_date" ON "invoices" ("invoice_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_due_date" ON "invoices" ("due_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_total_amount" ON "invoices" ("total_amount")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_customer_id" ON "invoices" ("customer_id")`,
    );

    // --- invoice_items ---
    await queryRunner.query(`
      CREATE TABLE "invoice_items" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "invoice_id" uuid        NOT NULL,
        "name"       varchar(255) NOT NULL,
        "quantity"   integer     NOT NULL,
        "rate"       numeric(14,2) NOT NULL,
        CONSTRAINT "pk_invoice_items" PRIMARY KEY ("id"),
        CONSTRAINT "chk_invoice_items_quantity_positive" CHECK ("quantity" > 0),
        CONSTRAINT "chk_invoice_items_rate_positive" CHECK ("rate" > 0),
        CONSTRAINT "fk_invoice_items_invoice" FOREIGN KEY ("invoice_id")
          REFERENCES "invoices" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_invoice_items_invoice_id" ON "invoice_items" ("invoice_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "invoices_status_enum"`);
  }
}
