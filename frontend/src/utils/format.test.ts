import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './format';

describe('format utils', () => {
  describe('formatMoney', () => {
    it('formats an amount with its symbol and two decimals', () => {
      expect(formatMoney(2180, 'AU$')).toBe('AU$ 2,180.00');
      expect(formatMoney(728.66, 'AU$')).toBe('AU$ 728.66');
      expect(formatMoney(0, '$')).toBe('$ 0.00');
    });
  });

  describe('formatDate', () => {
    it('formats an ISO date for display', () => {
      expect(formatDate('2026-06-03')).toBe('03 Jun 2026');
    });

    it('returns the original value for an invalid date', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });
  });
});
