import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceStatus, InvoiceStatusFilter } from './enums/invoice-status.enum';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceInput } from './types/create-invoice.input';

/** Build a minimal valid create input, overridable per test. */
function buildInput(overrides: Partial<CreateInvoiceInput> = {}): CreateInvoiceInput {
  return {
    invoiceNumber: 'IV-001',
    invoiceReference: null,
    invoiceDate: '2026-06-01',
    dueDate: '2026-07-01',
    currency: 'AUD',
    currencySymbol: null,
    description: null,
    taxPercent: 10,
    discount: 20,
    customer: { fullname: 'Paul', email: 'paul@example.com', mobileNumber: null, address: null },
    item: { name: 'Honda RC150', quantity: 2, rate: 1000 },
    ...overrides,
  };
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoicesRepository: jest.Mocked<Pick<Repository<Invoice>, 'findOne' | 'createQueryBuilder'>>;
  let transactionImpl: jest.Mock;

  // Per-entity repository mocks used inside the transaction manager.
  const txInvoiceRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
  };
  const txCustomerRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(),
  };
  const txItemRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(),
  };

  const managerMock = {
    getRepository: (entity: unknown) => {
      if (entity === Customer) return txCustomerRepo;
      if (entity === Invoice) return txInvoiceRepo;
      if (entity === InvoiceItem) return txItemRepo;
      throw new Error('Unexpected entity');
    },
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionImpl = jest.fn((cb: (m: typeof managerMock) => unknown) => cb(managerMock));

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: { findOne: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getDataSourceToken(),
          useValue: { transaction: transactionImpl } as Partial<DataSource>,
        },
      ],
    }).compile();

    service = moduleRef.get(InvoicesService);
    invoicesRepository = moduleRef.get(getRepositoryToken(Invoice));
  });

  describe('create', () => {
    it('rejects when due date is before the invoice date', async () => {
      await expect(
        service.create(buildInput({ invoiceDate: '2026-07-01', dueDate: '2026-06-01' }), 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transactionImpl).not.toHaveBeenCalled();
    });

    it('rejects a duplicate invoice number with a Conflict', async () => {
      txInvoiceRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(buildInput(), 'user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(txInvoiceRepo.save).not.toHaveBeenCalled();
    });

    it('persists a Draft invoice with server-calculated amounts and totalPaid 0', async () => {
      txInvoiceRepo.findOne.mockResolvedValue(null);
      txCustomerRepo.save.mockResolvedValue({ id: 'cust-1' });
      txInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      txItemRepo.save.mockResolvedValue({ id: 'item-1' });

      // findOne is called at the end to return the created view.
      invoicesRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        dueDate: '2026-07-01',
        status: InvoiceStatus.Draft,
        customer: {},
        items: [],
      } as unknown as Invoice);

      await service.create(buildInput(), 'user-1');

      const savedInvoice = txInvoiceRepo.save.mock.calls[0][0];
      expect(savedInvoice.status).toBe(InvoiceStatus.Draft);
      expect(savedInvoice.totalPaid).toBe(0);
      expect(savedInvoice.invoiceSubTotal).toBe(2000);
      expect(savedInvoice.totalTax).toBe(200);
      expect(savedInvoice.totalAmount).toBe(2180);
      expect(savedInvoice.balanceAmount).toBe(2180); // total - paid(0)
      expect(savedInvoice.createdBy).toBe('user-1');
      expect(savedInvoice.currencySymbol).toBe('AU$'); // derived from AUD
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the invoice does not exist', async () => {
      invoicesRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the invoice with a derived status', async () => {
      invoicesRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.Pending,
        dueDate: '2000-01-01', // long past due
        customer: {},
        items: [],
      } as unknown as Invoice);

      const result = await service.findOne('inv-1');
      expect(result.status).toBe(InvoiceStatusFilter.Overdue);
    });
  });

  describe('findAll', () => {
    it('returns paginated data with derived statuses', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'inv-1',
              status: InvoiceStatus.Pending,
              dueDate: '2000-01-01',
              customer: {},
            },
          ],
          1,
        ]),
      };
      invoicesRepository.createQueryBuilder.mockReturnValue(qb as never);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
        sortBy: 'invoiceDate',
        ordering: 'DESC',
      });

      expect(result.paging).toEqual({ page: 1, pageSize: 10, total: 1 });
      expect(result.data[0].status).toBe(InvoiceStatusFilter.Overdue);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });
  });
});
