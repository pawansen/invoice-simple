import { calculateInvoiceAmounts, round2 } from './invoice-calculations';

describe('invoice-calculations', () => {
  describe('round2', () => {
    it('rounds to two decimal places', () => {
      expect(round2(728.6566)).toBe(728.66);
      expect(round2(200)).toBe(200);
      expect(round2(0.1 + 0.2)).toBe(0.3); // floating-point safe
    });
  });

  describe('calculateInvoiceAmounts', () => {
    it('computes amounts for the Appendix A reference invoice', () => {
      // quantity 2 * rate 1000, tax 10%, discount 20, paid 1451.34
      const result = calculateInvoiceAmounts({
        quantity: 2,
        rate: 1000,
        taxPercent: 10,
        discount: 20,
        totalPaid: 1451.34,
      });

      expect(result.subTotal).toBe(2000);
      expect(result.taxAmount).toBe(200);
      expect(result.totalAmount).toBe(2180); // 2000 + 200 - 20
      expect(result.balanceAmount).toBe(728.66); // 2180 - 1451.34
    });

    it('handles zero tax and zero discount', () => {
      const result = calculateInvoiceAmounts({
        quantity: 3,
        rate: 50,
        taxPercent: 0,
        discount: 0,
        totalPaid: 0,
      });

      expect(result.subTotal).toBe(150);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(150);
      expect(result.balanceAmount).toBe(150);
    });

    it('applies tax then subtracts the discount', () => {
      const result = calculateInvoiceAmounts({
        quantity: 1,
        rate: 100,
        taxPercent: 15,
        discount: 10,
        totalPaid: 0,
      });

      // subTotal 100, tax 15, total 100 + 15 - 10 = 105
      expect(result.totalAmount).toBe(105);
    });

    it('rounds fractional tax correctly', () => {
      const result = calculateInvoiceAmounts({
        quantity: 1,
        rate: 99.99,
        taxPercent: 10,
        discount: 0,
        totalPaid: 0,
      });

      expect(result.subTotal).toBe(99.99);
      expect(result.taxAmount).toBe(10); // 9.999 -> 10.00
      expect(result.totalAmount).toBe(109.99);
    });
  });
});
