import { InvoiceStatusFilter } from '../enums/invoice-status.enum';

/** Fields the invoice list may be sorted by. */
export type InvoiceSortField = 'invoiceDate' | 'dueDate' | 'totalAmount';

export type SortOrdering = 'ASC' | 'DESC';

/**
 * Normalised query parameters for listing invoices. The API query DTO validates
 * and defaults raw request values before handing this to the service.
 */
export interface FindInvoicesQuery {
  page: number;
  pageSize: number;
  sortBy: InvoiceSortField;
  ordering: SortOrdering;
  status?: InvoiceStatusFilter;
  keyword?: string;
  fromDate?: string; // YYYY-MM-DD, inclusive (invoiceDate >=)
  toDate?: string; // YYYY-MM-DD, inclusive (invoiceDate <=)
}
