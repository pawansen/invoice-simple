import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatusFilter } from '../enums/invoice-status.enum';

/** Customer shape returned in invoice responses. */
export class CustomerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Paul' })
  fullname: string;

  @ApiProperty({ example: 'paul@101digital.io' })
  email: string;

  @ApiProperty({ example: '947717364111', nullable: true })
  mobileNumber: string | null;

  @ApiProperty({ example: 'Singapore', nullable: true })
  address: string | null;
}

/** Line item shape returned in invoice responses. */
export class InvoiceItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Honda RC150' })
  name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 1000 })
  rate: number;
}

/** Full invoice representation (detail + list rows). `status` is derived. */
export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'IV1780488206995' })
  invoiceNumber: string;

  @ApiProperty({ example: '#5721662', nullable: true })
  invoiceReference: string | null;

  @ApiProperty({ example: '2026-06-03' })
  invoiceDate: string;

  @ApiProperty({ example: '2026-07-03' })
  dueDate: string;

  @ApiProperty({ example: 'AUD' })
  currency: string;

  @ApiProperty({ example: 'AU$' })
  currencySymbol: string;

  @ApiProperty({ example: 'Invoice is issued to Kanglee', nullable: true })
  description: string | null;

  @ApiProperty({
    enum: InvoiceStatusFilter,
    description: 'Derived status — may be Overdue (never persisted)',
  })
  status: InvoiceStatusFilter;

  @ApiProperty({ example: 2000.0 })
  invoiceSubTotal: number;

  @ApiProperty({ example: 200.0 })
  totalTax: number;

  @ApiProperty({ example: 20.0 })
  totalDiscount: number;

  @ApiProperty({ example: 2180.0 })
  totalAmount: number;

  @ApiProperty({ example: 0.0 })
  totalPaid: number;

  @ApiProperty({ example: 2180.0 })
  balanceAmount: number;

  @ApiProperty({ type: CustomerResponseDto })
  customer: CustomerResponseDto;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

/** Pagination metadata matching the spec response shape. */
export class PagingDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 94 })
  total: number;
}

/** Response body for GET /invoices. */
export class PaginatedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data: InvoiceResponseDto[];

  @ApiProperty({ type: PagingDto })
  paging: PagingDto;
}
