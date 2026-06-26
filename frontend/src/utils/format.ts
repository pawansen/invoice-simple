/** Format a monetary amount with its currency symbol, e.g. "AU$ 2,180.00". */
export function formatMoney(amount: number, symbol: string): string {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

/** Format an ISO date (YYYY-MM-DD) for display, e.g. "03 Jun 2026". */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
