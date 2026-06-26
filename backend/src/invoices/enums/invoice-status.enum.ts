/**
 * Persisted invoice statuses.
 *
 * IMPORTANT: `Overdue` is intentionally NOT part of this enum. Per the
 * specification, the database only ever stores Draft, Pending or Paid.
 * `Overdue` is a *derived* status computed at read time
 * (status !== Paid && dueDate < today) and is never written to the database.
 */
export enum InvoiceStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Paid = 'Paid',
}

/**
 * The full set of statuses the API may *return* to clients, including the
 * derived `Overdue` value. Used for query-filter validation and Swagger docs.
 */
export enum InvoiceStatusFilter {
  Draft = 'Draft',
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
}
