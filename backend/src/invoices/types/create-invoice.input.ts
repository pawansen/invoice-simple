/**
 * Domain-level input for creating an invoice. The HTTP layer (CreateInvoiceDto,
 * added with the API module) maps onto this shape, keeping the service
 * independent of transport concerns.
 */
export interface CreateInvoiceCustomerInput {
  fullname: string;
  email: string;
  mobileNumber?: string | null;
  address?: string | null;
}

export interface CreateInvoiceItemInput {
  name: string;
  quantity: number;
  rate: number;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  invoiceReference?: string | null;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  currencySymbol?: string | null;
  description?: string | null;
  /** Tax percentage. Defaults to 10 when omitted (applied at the DTO layer). */
  taxPercent: number;
  /** Absolute discount amount. Defaults to 0 when omitted. */
  discount: number;
  customer: CreateInvoiceCustomerInput;
  item: CreateInvoiceItemInput;
}
