import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { calculateInvoiceAmounts } from './invoice-calculations';
import { getCurrencySymbol } from './currency.util';
import { deriveStatus, getToday } from './invoice-status.util';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceStatus, InvoiceStatusFilter } from './enums/invoice-status.enum';
import { CreateInvoiceInput } from './types/create-invoice.input';
import { FindInvoicesQuery } from './types/find-invoices.query';
import { InvoiceView, PaginatedInvoices } from './types/invoice-view.type';

/** PostgreSQL unique-violation error code. */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new invoice. All amounts are calculated server-side; the invoice
   * is always created with status Draft and totalPaid 0. The customer, invoice
   * and its single line item are persisted atomically in one transaction.
   */
  async create(input: CreateInvoiceInput, userId: string): Promise<InvoiceView> {
    // Business rule: due date must be on or after the invoice date.
    if (input.dueDate < input.invoiceDate) {
      throw new BadRequestException(['dueDate must be on or after invoiceDate']);
    }

    const totalPaid = 0;
    const amounts = calculateInvoiceAmounts({
      quantity: input.item.quantity,
      rate: input.item.rate,
      taxPercent: input.taxPercent,
      discount: input.discount,
      totalPaid,
    });

    let invoiceId: string;
    try {
      invoiceId = await this.dataSource.transaction(async (manager) => {
        // Defensive pre-check for a friendly error; the DB unique constraint is
        // the actual guarantee (handled in the catch below).
        const existing = await manager.getRepository(Invoice).findOne({
          where: { invoiceNumber: input.invoiceNumber },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException(
            `Invoice number "${input.invoiceNumber}" already exists`,
          );
        }

        // Each invoice owns its customer record (customer data is captured
        // per-invoice, mirroring the spec's "embedded customer" semantics).
        const customer = await manager.getRepository(Customer).save(
          manager.getRepository(Customer).create({
            fullname: input.customer.fullname,
            email: input.customer.email,
            mobileNumber: input.customer.mobileNumber ?? null,
            address: input.customer.address ?? null,
          }),
        );

        const invoice = await manager.getRepository(Invoice).save(
          manager.getRepository(Invoice).create({
            invoiceNumber: input.invoiceNumber,
            invoiceReference: input.invoiceReference ?? null,
            invoiceDate: input.invoiceDate,
            dueDate: input.dueDate,
            currency: input.currency.toUpperCase(),
            currencySymbol:
              input.currencySymbol ?? getCurrencySymbol(input.currency),
            description: input.description ?? null,
            status: InvoiceStatus.Draft,
            invoiceSubTotal: amounts.subTotal,
            totalTax: amounts.taxAmount,
            totalDiscount: input.discount,
            totalAmount: amounts.totalAmount,
            totalPaid,
            balanceAmount: amounts.balanceAmount,
            customerId: customer.id,
            createdBy: userId,
          }),
        );

        await manager.getRepository(InvoiceItem).save(
          manager.getRepository(InvoiceItem).create({
            invoiceId: invoice.id,
            name: input.item.name,
            quantity: input.item.quantity,
            rate: input.item.rate,
          }),
        );

        return invoice.id;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as unknown as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Invoice number "${input.invoiceNumber}" already exists`,
        );
      }
      throw error;
    }

    return this.findOne(invoiceId);
  }

  /**
   * List invoices with server-side search, filter, sort and pagination.
   *
   * Status filtering operates on the DERIVED status so it is consistent with
   * what the user sees: e.g. a Pending invoice past its due date is displayed
   * (and filtered) as Overdue, not Pending. The SQL conditions below encode
   * this without ever persisting Overdue.
   */
  async findAll(query: FindInvoicesQuery): Promise<PaginatedInvoices> {
    const { page, pageSize, sortBy, ordering, status, keyword, fromDate, toDate } =
      query;
    const today = getToday();

    const qb = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer');

    // Search: case-insensitive, partial match on invoice number OR customer name.
    if (keyword) {
      qb.andWhere(
        '(invoice.invoiceNumber ILIKE :kw OR customer.fullname ILIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    // Status filter (derived-status aware).
    if (status) {
      switch (status) {
        case InvoiceStatusFilter.Overdue:
          qb.andWhere('invoice.status != :paid AND invoice.dueDate < :today', {
            paid: InvoiceStatus.Paid,
            today,
          });
          break;
        case InvoiceStatusFilter.Paid:
          qb.andWhere('invoice.status = :paid', { paid: InvoiceStatus.Paid });
          break;
        default:
          // Draft / Pending: must still be the persisted status AND not overdue.
          qb.andWhere('invoice.status = :status AND invoice.dueDate >= :today', {
            status,
            today,
          });
          break;
      }
    }

    // Date range on invoice date (inclusive).
    if (fromDate) {
      qb.andWhere('invoice.invoiceDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      qb.andWhere('invoice.invoiceDate <= :toDate', { toDate });
    }

    // Sort (whitelisted field -> column) and stable tiebreaker.
    const sortColumnMap: Record<typeof sortBy, string> = {
      invoiceDate: 'invoice.invoiceDate',
      dueDate: 'invoice.dueDate',
      totalAmount: 'invoice.totalAmount',
    };
    qb.orderBy(sortColumnMap[sortBy], ordering).addOrderBy('invoice.id', 'ASC');

    // Pagination (server-side).
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [invoices, total] = await qb.getManyAndCount();

    return {
      data: invoices.map((invoice) => this.toView(invoice, today)),
      paging: { page, pageSize, total },
    };
  }

  /** Fetch a single invoice with its customer and line items. */
  async findOne(id: string): Promise<InvoiceView> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: { customer: true, items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toView(invoice);
  }

  /** Map a persisted invoice to its client view with derived status applied. */
  private toView(invoice: Invoice, today: string = getToday()): InvoiceView {
    const { createdByUser, status, ...rest } = invoice;
    void createdByUser; // never exposed to clients
    return {
      ...rest,
      status: deriveStatus(status, invoice.dueDate, today),
    } as InvoiceView;
  }
}
