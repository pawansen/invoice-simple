-- =============================================================================
-- SimpleInvoice — Reference SQL Schema (PostgreSQL)
-- =============================================================================
-- This file documents the database schema in plain SQL. It is the equivalent
-- of the TypeORM migration (1700000000000-InitSchema.ts), which is the
-- authoritative source applied at runtime. Provided for review/reference.
--
-- Design notes:
--   * customers is a separate (normalised) table referenced by invoices.
--   * invoices.status persists only Draft/Pending/Paid. "Overdue" is derived
--     at read time (status != Paid AND due_date < today) and never stored.
--   * All monetary fields are calculated server-side and stored as numeric(14,2).
--   * Indexes back the list screen: status (filter); invoice_date, due_date,
--     total_amount (sort); customers.fullname + invoice_number (search).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Persisted invoice statuses (Overdue intentionally excluded).
CREATE TYPE invoices_status_enum AS ENUM ('Draft', 'Pending', 'Paid');

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            uuid         NOT NULL DEFAULT gen_random_uuid(),
    email         varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,   -- bcrypt hash, never exposed
    fullname      varchar(255) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT pk_users PRIMARY KEY (id)
);
CREATE UNIQUE INDEX uq_users_email ON users (email);

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id            uuid         NOT NULL DEFAULT gen_random_uuid(),
    fullname      varchar(255) NOT NULL,
    email         varchar(255) NOT NULL,
    mobile_number varchar(50),
    address       varchar(500),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT pk_customers PRIMARY KEY (id)
);
CREATE INDEX idx_customers_fullname ON customers (fullname);

-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
    id                uuid          NOT NULL DEFAULT gen_random_uuid(),
    invoice_number    varchar(100)  NOT NULL,
    invoice_reference varchar(100),
    invoice_date      date          NOT NULL,
    due_date          date          NOT NULL,
    currency          varchar(3)    NOT NULL,   -- ISO 4217, e.g. AUD
    currency_symbol   varchar(10)   NOT NULL,   -- e.g. AU$
    description       varchar(1000),
    status            invoices_status_enum NOT NULL DEFAULT 'Draft',
    invoice_sub_total numeric(14,2) NOT NULL,   -- quantity * rate
    total_tax         numeric(14,2) NOT NULL,   -- sub_total * tax% / 100
    total_discount    numeric(14,2) NOT NULL DEFAULT 0,
    total_amount      numeric(14,2) NOT NULL,   -- sub_total + tax - discount
    total_paid        numeric(14,2) NOT NULL DEFAULT 0,
    balance_amount    numeric(14,2) NOT NULL,   -- total_amount - total_paid
    customer_id       uuid          NOT NULL,
    created_by        uuid          NOT NULL,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT chk_invoices_due_after_invoice CHECK (due_date >= invoice_date),
    CONSTRAINT chk_invoices_non_negative CHECK (
        invoice_sub_total >= 0 AND total_tax >= 0 AND total_discount >= 0
        AND total_amount >= 0 AND total_paid >= 0
    ),
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX uq_invoices_invoice_number ON invoices (invoice_number);
CREATE INDEX idx_invoices_status        ON invoices (status);
CREATE INDEX idx_invoices_invoice_date  ON invoices (invoice_date);
CREATE INDEX idx_invoices_due_date      ON invoices (due_date);
CREATE INDEX idx_invoices_total_amount  ON invoices (total_amount);
CREATE INDEX idx_invoices_customer_id   ON invoices (customer_id);

-- -----------------------------------------------------------------------------
-- invoice_items  (one-to-many; one item per invoice for this assessment)
-- -----------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id         uuid          NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid          NOT NULL,
    name       varchar(255)  NOT NULL,
    quantity   integer       NOT NULL,
    rate       numeric(14,2) NOT NULL,
    CONSTRAINT pk_invoice_items PRIMARY KEY (id),
    CONSTRAINT chk_invoice_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_invoice_items_rate_positive CHECK (rate > 0),
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items (invoice_id);
