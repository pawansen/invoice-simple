import { z } from 'zod';

const dateString = z
  .string()
  .min(1, 'Required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');

/**
 * Create-invoice form schema. Mirrors the server-side validation rules so the
 * user gets immediate feedback; the backend remains the source of truth and
 * performs all calculations. `z.coerce` converts the string inputs from the
 * native number/date fields into the correct types.
 */
export const createInvoiceSchema = z
  .object({
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    invoiceReference: z.string().optional(),
    invoiceDate: dateString,
    dueDate: dateString,
    currency: z.string().min(1, 'Currency is required'),
    description: z.string().optional(),
    taxPercent: z.coerce
      .number({ invalid_type_error: 'Tax must be a number' })
      .min(0, 'Tax must be 0 or greater'),
    discount: z.coerce
      .number({ invalid_type_error: 'Discount must be a number' })
      .min(0, 'Discount must be 0 or greater'),
    customer: z.object({
      fullname: z.string().min(1, 'Customer name is required'),
      email: z.string().min(1, 'Email is required').email('Enter a valid email'),
      mobileNumber: z.string().optional(),
      address: z.string().optional(),
    }),
    item: z.object({
      name: z.string().min(1, 'Item name is required'),
      quantity: z.coerce
        .number({ invalid_type_error: 'Quantity must be a number' })
        .int('Quantity must be a whole number')
        .positive('Quantity must be greater than 0'),
      rate: z.coerce
        .number({ invalid_type_error: 'Rate must be a number' })
        .positive('Rate must be greater than 0'),
    }),
  })
  .refine((data) => data.dueDate >= data.invoiceDate, {
    message: 'Due date must be on or after the invoice date',
    path: ['dueDate'],
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
