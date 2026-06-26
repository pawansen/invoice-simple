import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices.api';
import { InvoiceListParams } from '../types/invoice';

/** Paginated invoice list. Keeps previous data so pagination feels seamless. */
export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
