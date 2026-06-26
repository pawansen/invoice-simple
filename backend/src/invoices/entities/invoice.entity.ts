import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { User } from '../../users/entities/user.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { Customer } from './customer.entity';
import { InvoiceItem } from './invoice-item.entity';

/**
 * Invoice aggregate root.
 *
 * All monetary fields are CALCULATED SERVER-SIDE and persisted; the frontend
 * never sends computed totals. The `status` column persists only Draft,
 * Pending or Paid — the `Overdue` status is derived at read time and never
 * stored (see InvoiceStatus enum and InvoicesService).
 *
 * Database-level guarantees:
 *  - invoiceNumber is UNIQUE (uq_invoices_invoice_number).
 *  - dueDate >= invoiceDate (CHECK constraint, in addition to DTO validation).
 *  - monetary amounts are non-negative (CHECK constraint).
 * Indexes back the list screen's filter (status) and sort (invoiceDate,
 * dueDate, totalAmount) requirements.
 */
@Entity({ name: 'invoices' })
@Index('idx_invoices_status', ['status'])
@Index('idx_invoices_invoice_date', ['invoiceDate'])
@Index('idx_invoices_due_date', ['dueDate'])
@Index('idx_invoices_total_amount', ['totalAmount'])
@Index('idx_invoices_customer_id', ['customerId'])
@Check('chk_invoices_due_after_invoice', '"due_date" >= "invoice_date"')
@Check(
  'chk_invoices_non_negative',
  '"invoice_sub_total" >= 0 AND "total_tax" >= 0 AND "total_discount" >= 0 AND "total_amount" >= 0 AND "total_paid" >= 0',
)
export class Invoice {
  /** Primary key (referred to as `invoiceId` in the spec data model). */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** User-provided, globally unique invoice number. */
  @Index('uq_invoices_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', type: 'varchar', length: 100 })
  invoiceNumber: string;

  /** Optional external reference, e.g. "#5721662". */
  @Column({ name: 'invoice_reference', type: 'varchar', length: 100, nullable: true })
  invoiceReference: string | null;

  /** Stored as a calendar date (no time / timezone) in YYYY-MM-DD form. */
  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  /** ISO 4217 currency code, e.g. "AUD". */
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /** Display symbol, e.g. "AU$". */
  @Column({ name: 'currency_symbol', type: 'varchar', length: 10 })
  currencySymbol: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  /**
   * Persisted status — only Draft / Pending / Paid. Overdue is derived and
   * never written here.
   */
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.Draft })
  status: InvoiceStatus;

  // --- Server-calculated monetary fields (numeric(14,2)) ---

  @Column({
    name: 'invoice_sub_total',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  invoiceSubTotal: number;

  @Column({
    name: 'total_tax',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalTax: number;

  @Column({
    name: 'total_discount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalDiscount: number;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  @Column({
    name: 'total_paid',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalPaid: number;

  @Column({
    name: 'balance_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  balanceAmount: number;

  // --- Relationships ---

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.invoices, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
    eager: true,
  })
  items: InvoiceItem[];

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, (user) => user.invoices, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
