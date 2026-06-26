import { InvoiceStatus } from '../../invoices/enums/invoice-status.enum';

/**
 * Plain description of an invoice to seed. Monetary totals are intentionally
 * NOT included here — they are calculated server-side by the seed script using
 * the same business logic as the API, guaranteeing consistency.
 */
export interface SeedInvoice {
  invoiceNumber: string;
  invoiceReference: string | null;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  description: string | null;
  /** Persisted status only (Draft/Pending/Paid) — never Overdue. */
  status: InvoiceStatus;
  taxPercent: number;
  discount: number;
  /** Amount already paid; combined with the computed total to give the balance. */
  totalPaid: number;
  item: { name: string; quantity: number; rate: number };
  customer: {
    fullname: string;
    email: string;
    mobileNumber: string | null;
    address: string | null;
  };
}

/** Tiny deterministic PRNG (mulberry32) so seed output is reproducible. */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const FIRST_NAMES = [
  'Paul', 'Aisha', 'Liam', 'Sophia', 'Noah', 'Mia', 'Lucas', 'Olivia', 'Ethan',
  'Ava', 'James', 'Isabella', 'Benjamin', 'Charlotte', 'Henry', 'Amelia',
  'Daniel', 'Harper', 'Matthew', 'Evelyn',
];
const LAST_NAMES = [
  'Tan', 'Smith', 'Lee', 'Nguyen', 'Khan', 'Brown', 'Wong', 'Garcia', 'Patel',
  'Johnson', 'Kumar', 'Davis', 'Lim', 'Martinez', 'Chen',
];
const CITIES = ['Singapore', 'Sydney', 'London', 'Auckland', 'Mumbai', 'Toronto', 'Melbourne'];
const PRODUCTS = [
  'Honda RC150', 'Office Chair', 'Standing Desk', 'Laptop Stand', 'Web Hosting (Annual)',
  'Consulting Hours', 'Marketing Package', 'Software License', 'Mountain Bike',
  'Conference Ticket', 'Wireless Headset', 'Monitor 27"', 'Cloud Storage Plan',
];
const CURRENCIES = ['AUD', 'USD', 'GBP', 'SGD', 'NZD'];
const STATUSES = [InvoiceStatus.Draft, InvoiceStatus.Pending, InvoiceStatus.Paid];
const TAX_RATES = [0, 5, 10, 15];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * The canonical record from Appendix A. Note: the appendix lists it as
 * "Overdue", but Overdue is a derived status and is never persisted. Because it
 * is partially paid, it is seeded as Pending; if its due date is in the past it
 * will still be *displayed* as Overdue by the read-time derivation.
 */
function appendixRecord(): SeedInvoice {
  return {
    invoiceNumber: 'IV1780488206995',
    invoiceReference: '#5721662',
    invoiceDate: '2026-06-03',
    dueDate: '2026-07-03',
    currency: 'AUD',
    description: 'Invoice is issued to Kanglee',
    status: InvoiceStatus.Pending,
    taxPercent: 10,
    discount: 20,
    totalPaid: 1451.34,
    item: { name: 'Honda RC150', quantity: 2, rate: 1000 },
    customer: {
      fullname: 'Paul',
      address: 'Singapore',
      email: 'paul@101digital.io',
      mobileNumber: '947717364111',
    },
  };
}

/**
 * Build the full seed dataset: the Appendix A record plus `generatedCount`
 * additional invoices with a deliberate spread of statuses, dates (some past
 * due so Overdue derivation is demonstrable), amounts and customers.
 */
export function buildSeedInvoices(today: Date, generatedCount = 32): SeedInvoice[] {
  const rng = createRng(20260626);
  const invoices: SeedInvoice[] = [appendixRecord()];

  for (let i = 0; i < generatedCount; i++) {
    const status = pick(rng, STATUSES);
    // Spread invoice dates across the last ~120 days.
    const invoiceDate = addDays(today, -randomInt(rng, 0, 120));
    // Due 7–45 days after invoice date — some will land before "today".
    const dueDate = addDays(invoiceDate, randomInt(rng, 7, 45));

    const quantity = randomInt(rng, 1, 10);
    const rate = randomInt(rng, 50, 2000);
    const taxPercent = pick(rng, TAX_RATES);
    const discount = rng() < 0.4 ? randomInt(rng, 5, 100) : 0;

    // Determine paid amount consistent with the status.
    const subTotal = quantity * rate;
    const total = subTotal + subTotal * (taxPercent / 100) - discount;
    let totalPaid = 0;
    if (status === InvoiceStatus.Paid) {
      totalPaid = Math.max(total, 0);
    } else if (status === InvoiceStatus.Pending) {
      totalPaid = Math.round(Math.max(total, 0) * (rng() * 0.6) * 100) / 100;
    }

    const fullname = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    const emailHandle = fullname.toLowerCase().replace(/\s+/g, '.');

    invoices.push({
      invoiceNumber: `IV-${formatDate(invoiceDate).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
      invoiceReference: rng() < 0.5 ? `#${randomInt(rng, 1000000, 9999999)}` : null,
      invoiceDate: formatDate(invoiceDate),
      dueDate: formatDate(dueDate),
      currency: pick(rng, CURRENCIES),
      description: `Invoice for ${fullname}`,
      status,
      taxPercent,
      discount,
      totalPaid,
      item: { name: pick(rng, PRODUCTS), quantity, rate },
      customer: {
        fullname,
        email: `${emailHandle}@example.com`,
        mobileNumber: `+6591${randomInt(rng, 100000, 999999)}`,
        address: pick(rng, CITIES),
      },
    });
  }

  return invoices;
}
