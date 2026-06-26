import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Invoice } from './invoice.entity';

/**
 * A single invoice line item. The current assessment requires exactly one item
 * per invoice, but the data model intentionally supports many (one-to-many)
 * so multiple items can be added in future without a schema change.
 *
 * DB CHECK constraints mirror the DTO validation: quantity must be a positive
 * integer and rate a positive number.
 */
@Entity({ name: 'invoice_items' })
@Index('idx_invoice_items_invoice_id', ['invoiceId'])
@Check('chk_invoice_items_quantity_positive', '"quantity" > 0')
@Check('chk_invoice_items_rate_positive', '"rate" > 0')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  rate: number;
}
