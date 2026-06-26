import Chip from '@mui/material/Chip';
import { InvoiceStatus } from '../types/invoice';

const STATUS_COLOR: Record<
  InvoiceStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  Draft: 'default',
  Pending: 'warning',
  Paid: 'success',
  Overdue: 'error',
};

/** Coloured status badge. Overdue is a derived status surfaced by the backend. */
export function StatusChip({ status }: { status: InvoiceStatus }) {
  return <Chip size="small" label={status} color={STATUS_COLOR[status]} />;
}
