import { InvoiceStatus, InvoiceStatusFilter } from './enums/invoice-status.enum';
import { deriveStatus, getToday } from './invoice-status.util';

describe('invoice-status.util', () => {
  describe('getToday', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(getToday(new Date('2026-06-26T13:45:00'))).toBe('2026-06-26');
    });
  });

  describe('deriveStatus', () => {
    const today = '2026-06-26';

    it('returns Overdue when a non-Paid invoice is past its due date', () => {
      expect(deriveStatus(InvoiceStatus.Pending, '2026-06-01', today)).toBe(
        InvoiceStatusFilter.Overdue,
      );
      expect(deriveStatus(InvoiceStatus.Draft, '2026-06-25', today)).toBe(
        InvoiceStatusFilter.Overdue,
      );
    });

    it('never marks a Paid invoice as Overdue', () => {
      expect(deriveStatus(InvoiceStatus.Paid, '2026-01-01', today)).toBe(
        InvoiceStatusFilter.Paid,
      );
    });

    it('keeps the persisted status when the due date is today or in the future', () => {
      expect(deriveStatus(InvoiceStatus.Pending, '2026-06-26', today)).toBe(
        InvoiceStatusFilter.Pending,
      );
      expect(deriveStatus(InvoiceStatus.Draft, '2026-12-31', today)).toBe(
        InvoiceStatusFilter.Draft,
      );
    });
  });
});
