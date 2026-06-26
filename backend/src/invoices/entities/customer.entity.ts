import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

/**
 * Customer the invoice is billed to. Stored as a normalised table (rather than
 * embedded columns on the invoice) so the schema cleanly demonstrates
 * relationships and allows a customer to be reused across invoices in future.
 *
 * `fullname` is indexed to support the case-insensitive partial search on the
 * invoice list (search matches invoiceNumber OR customer name).
 */
@Entity({ name: 'customers' })
@Index('idx_customers_fullname', ['fullname'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fullname: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'mobile_number', type: 'varchar', length: 50, nullable: true })
  mobileNumber: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];
}
