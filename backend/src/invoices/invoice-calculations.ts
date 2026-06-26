/**
 * Pure, side-effect-free invoice money calculations. Kept separate from the
 * service so the business arithmetic can be unit-tested in isolation (a spec
 * requirement). ALL invoice totals are produced here on the server — the
 * frontend never computes monetary values.
 */

/** Round to 2 decimal places, guarding against binary floating-point drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface AmountInputs {
  quantity: number;
  rate: number;
  /** Tax percentage, e.g. 10 for 10%. */
  taxPercent: number;
  /** Absolute discount amount applied to the total. */
  discount: number;
  /** Amount already paid against the invoice. */
  totalPaid: number;
}

export interface CalculatedAmounts {
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
}

/**
 * Compute the invoice amounts exactly as specified:
 *   subTotal      = quantity * rate
 *   taxAmount     = subTotal * (tax% / 100)
 *   totalAmount   = subTotal + taxAmount - discount
 *   balanceAmount = totalAmount - totalPaid
 */
export function calculateInvoiceAmounts({
  quantity,
  rate,
  taxPercent,
  discount,
  totalPaid,
}: AmountInputs): CalculatedAmounts {
  const subTotal = round2(quantity * rate);
  const taxAmount = round2(subTotal * (taxPercent / 100));
  const totalAmount = round2(subTotal + taxAmount - discount);
  const balanceAmount = round2(totalAmount - totalPaid);

  return { subTotal, taxAmount, totalAmount, balanceAmount };
}
