import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices.api';

/** Single invoice detail by id. */
export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id as string),
    enabled: Boolean(id),
  });
}
