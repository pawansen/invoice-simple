import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';
import { Customer } from '../../invoices/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { InvoiceItem } from '../../invoices/entities/invoice-item.entity';
import { calculateInvoiceAmounts } from '../../invoices/invoice-calculations';
import { getCurrencySymbol } from '../../invoices/currency.util';
import { User } from '../../users/entities/user.entity';
import dataSource from '../data-source';
import { buildSeedInvoices } from './seed-data';

const logger = new Logger('Seed');

/**
 * Database seed script (run with `npm run seed`).
 *
 * 1. Ensures the schema exists (migrations run on data-source init).
 * 2. Creates/updates a single default reviewer user (credentials from env).
 * 3. Clears existing invoice data and inserts the Appendix A record plus a
 *    spread of generated invoices so search/filter/sort/pagination are
 *    meaningful to test. All monetary totals are computed with the same
 *    business logic used by the API; Overdue is never persisted.
 */
async function seed(): Promise<void> {
  const email = process.env.SEED_USER_EMAIL ?? 'admin@simpleinvoice.io';
  const password = process.env.SEED_USER_PASSWORD ?? 'Password123!';
  const fullname = process.env.SEED_USER_FULLNAME ?? 'Demo Admin';

  await dataSource.initialize();
  logger.log('Data source initialised (migrations applied).');

  await dataSource.transaction(async (manager) => {
    // --- Default user (idempotent upsert by email) ---
    const userRepo = manager.getRepository(User);
    let user = await userRepo.findOne({ where: { email } });
    const passwordHash = bcrypt.hashSync(password, 10);
    if (user) {
      await userRepo.update(user.id, { passwordHash, fullname });
      logger.log(`Updated existing default user: ${email}`);
    } else {
      user = await userRepo.save(userRepo.create({ email, passwordHash, fullname }));
      logger.log(`Created default user: ${email}`);
    }

    // --- Reset invoice data so the seed is repeatable ---
    await manager.query(
      'TRUNCATE TABLE "invoice_items", "invoices", "customers" RESTART IDENTITY CASCADE',
    );
    logger.log('Cleared existing invoices, items and customers.');

    // --- Insert seed invoices ---
    const today = new Date();
    const seedInvoices = buildSeedInvoices(today);

    for (const s of seedInvoices) {
      const amounts = calculateInvoiceAmounts({
        quantity: s.item.quantity,
        rate: s.item.rate,
        taxPercent: s.taxPercent,
        discount: s.discount,
        totalPaid: s.totalPaid,
      });

      const customer = await manager.getRepository(Customer).save(
        manager.getRepository(Customer).create(s.customer),
      );

      const invoice = await manager.getRepository(Invoice).save(
        manager.getRepository(Invoice).create({
          invoiceNumber: s.invoiceNumber,
          invoiceReference: s.invoiceReference,
          invoiceDate: s.invoiceDate,
          dueDate: s.dueDate,
          currency: s.currency.toUpperCase(),
          currencySymbol: getCurrencySymbol(s.currency),
          description: s.description,
          status: s.status,
          invoiceSubTotal: amounts.subTotal,
          totalTax: amounts.taxAmount,
          totalDiscount: s.discount,
          totalAmount: amounts.totalAmount,
          totalPaid: s.totalPaid,
          balanceAmount: amounts.balanceAmount,
          customerId: customer.id,
          createdBy: user!.id,
        }),
      );

      await manager.getRepository(InvoiceItem).save(
        manager.getRepository(InvoiceItem).create({
          invoiceId: invoice.id,
          name: s.item.name,
          quantity: s.item.quantity,
          rate: s.item.rate,
        }),
      );
    }

    logger.log(`Seeded ${seedInvoices.length} invoices.`);
  });

  await dataSource.destroy();
  logger.log('Seeding complete.');
  logger.log(`Reviewer login -> email: ${email} | password: ${password}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Seeding failed', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
