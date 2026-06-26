import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/entities/user.entity';

/**
 * End-to-end test for the key workflow: authenticate, create an invoice, then
 * verify it appears in the invoice list.
 *
 * Requires a running PostgreSQL instance (configured via the same .env vars as
 * the app). It runs automatically under Docker / CI where the database service
 * is available — see README.
 */
describe('Invoices workflow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  const credentials = { email: 'e2e@simpleinvoice.io', password: 'Password123!' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    dataSource = app.get(DataSource);

    // Seed a known user for the login step.
    const userRepo = dataSource.getRepository(User);
    await userRepo.delete({ email: credentials.email });
    await userRepo.save(
      userRepo.create({
        email: credentials.email,
        passwordHash: bcrypt.hashSync(credentials.password, 10),
        fullname: 'E2E User',
      }),
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.getRepository(User).delete({ email: credentials.email });
    }
    await app?.close();
  });

  it('rejects protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/invoices').expect(401);
  });

  it('logs in and returns a JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    token = res.body.accessToken;
  });

  it('creates an invoice and finds it in the list', async () => {
    const invoiceNumber = `E2E-${Date.now()}`;
    const createRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceNumber,
        invoiceDate: '2026-06-01',
        dueDate: '2026-07-01',
        currency: 'AUD',
        taxPercent: 10,
        discount: 20,
        customer: { fullname: 'E2E Customer', email: 'cust@example.com' },
        item: { name: 'Test Item', quantity: 2, rate: 1000 },
      })
      .expect(201);

    // Server-side calculation is correct and status is Draft.
    expect(createRes.body.status).toBe('Draft');
    expect(createRes.body.totalAmount).toBe(2180);
    expect(createRes.body.balanceAmount).toBe(2180);

    const listRes = await request(app.getHttpServer())
      .get('/invoices')
      .query({ keyword: invoiceNumber })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body.paging.total).toBeGreaterThanOrEqual(1);
    expect(
      listRes.body.data.some((inv: { invoiceNumber: string }) => inv.invoiceNumber === invoiceNumber),
    ).toBe(true);
  });

  it('rejects an invoice whose due date precedes the invoice date', async () => {
    await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceNumber: `E2E-BAD-${Date.now()}`,
        invoiceDate: '2026-07-01',
        dueDate: '2026-06-01',
        currency: 'AUD',
        customer: { fullname: 'X', email: 'x@example.com' },
        item: { name: 'Y', quantity: 1, rate: 10 },
      })
      .expect(400);
  });
});
