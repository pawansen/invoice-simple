import { InvoiceStatusFilter } from '../enums/invoice-status.enum';
import { Invoice } from '../entities/invoice.entity';

/**
 * An invoice as returned to clients: identical to the persisted entity except
 * `status` is the DERIVED status (which may be "Overdue"). Produced by the
 * service at read time; never persisted.
 */
export type InvoiceView = Omit<Invoice, 'status' | 'createdByUser'> & {
  status: InvoiceStatusFilter;
};

/** Paginated list result matching the spec response shape. */
export interface PaginatedInvoices {
  data: InvoiceView[];
  paging: {
    page: number;
    pageSize: number;
    total: number;
  };
}
