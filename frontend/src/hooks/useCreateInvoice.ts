import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices.api';
import { CreateInvoicePayload, Invoice } from '../types/invoice';

/** Create an invoice and refresh the cached list on success. */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, unknown, CreateInvoicePayload>({
    mutationFn: (payload) => invoicesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
