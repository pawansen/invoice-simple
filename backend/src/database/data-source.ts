import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Customer } from '../invoices/entities/customer.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceItem } from '../invoices/entities/invoice-item.entity';
import { User } from '../users/entities/user.entity';

/**
 * Shared TypeORM configuration.
 *
 * Used both by the TypeORM CLI (migrations, schema sync) and by the NestJS
 * `TypeOrmModule` so the runtime app and the CLI never drift apart. All
 * connection values come exclusively from environment variables — no
 * credentials are hardcoded.
 *
 * `migrationsRun` is enabled so a fresh container applies the schema on first
 * boot; `synchronize` is always false (migrations are the single source of
 * truth for the schema).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'simple_invoice',
  entities: [User, Customer, Invoice, InvoiceItem],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  migrationsRun: true,
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
