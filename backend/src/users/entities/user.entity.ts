import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from '../../invoices/entities/invoice.entity';

/**
 * Application user. Email is the login identifier and is globally unique.
 * The password is stored only as a bcrypt hash — the plaintext is never
 * persisted or logged.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Login identifier. Unique, case-sensitive at the DB level. */
  @Index('uq_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Bcrypt hash of the user's password. Never exposed via the API. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  /** Human-readable display name. */
  @Column({ type: 'varchar', length: 255 })
  fullname: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  /** Invoices created by this user. */
  @OneToMany(() => Invoice, (invoice) => invoice.createdByUser)
  invoices: Invoice[];
}
