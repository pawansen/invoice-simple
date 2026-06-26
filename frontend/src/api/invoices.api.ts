import {
  CreateInvoicePayload,
  Invoice,
  InvoiceListParams,
  PaginatedInvoices,
} from '../types/invoice';
import { apiClient } from './axios';

export const invoicesApi = {
  async list(params: InvoiceListParams): Promise<PaginatedInvoices> {
    // Strip undefined values so they are not serialised as empty query params.
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
    );
    const { data } = await apiClient.get<PaginatedInvoices>('/invoices', { params: cleaned });
    return data;
  },

  async getById(id: string): Promise<Invoice> {
    const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
    return data;
  },

  async create(payload: CreateInvoicePayload): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>('/invoices', payload);
    return data;
  },
};
