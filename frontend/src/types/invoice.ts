export type InvoiceStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue';

/** Statuses a user may create/filter — Overdue is derived, not selectable on create. */
export const INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Pending', 'Paid', 'Overdue'];

export type InvoiceSortField = 'invoiceDate' | 'dueDate' | 'totalAmount';
export type SortOrdering = 'ASC' | 'DESC';

export interface Customer {
  id: string;
  fullname: string;
  email: string;
  mobileNumber: string | null;
  address: string | null;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceReference: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description: string | null;
  status: InvoiceStatus;
  invoiceSubTotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  customer: Customer;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Paging {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedInvoices {
  data: Invoice[];
  paging: Paging;
}

export interface InvoiceListParams {
  page: number;
  pageSize: number;
  sortBy: InvoiceSortField;
  ordering: SortOrdering;
  status?: InvoiceStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateInvoicePayload {
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  description?: string;
  taxPercent: number;
  discount: number;
  customer: {
    fullname: string;
    email: string;
    mobileNumber?: string;
    address?: string;
  };
  item: {
    name: string;
    quantity: number;
    rate: number;
  };
}
