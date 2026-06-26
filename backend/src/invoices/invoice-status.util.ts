import { InvoiceStatus, InvoiceStatusFilter } from './enums/invoice-status.enum';

/**
 * Return today's date as an ISO calendar date (YYYY-MM-DD) in the server's
 * local timezone. Used for the Overdue derivation and for date comparisons,
 * which are safe as lexical string comparisons because the format is
 * zero-padded ISO-8601.
 */
export function getToday(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Derive the status presented to clients.
 *
 *   if status !== "Paid" AND dueDate < today  => "Overdue"
 *   otherwise                                 => the persisted status
 *
 * Overdue is never persisted; it is computed here at read time.
 */
export function deriveStatus(
  persistedStatus: InvoiceStatus,
  dueDate: string,
  today: string = getToday(),
): InvoiceStatusFilter {
  if (persistedStatus !== InvoiceStatus.Paid && dueDate < today) {
    return InvoiceStatusFilter.Overdue;
  }
  return persistedStatus as unknown as InvoiceStatusFilter;
}
