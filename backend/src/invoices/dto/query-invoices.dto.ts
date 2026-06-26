import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InvoiceStatusFilter } from '../enums/invoice-status.enum';
import {
  InvoiceSortField,
  SortOrdering,
} from '../types/find-invoices.query';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SORT_FIELDS: InvoiceSortField[] = ['invoiceDate', 'dueDate', 'totalAmount'];

/** Validated query parameters for GET /invoices. */
export class QueryInvoicesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Records per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'invoiceDate' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: InvoiceSortField = 'invoiceDate';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['ASC', 'DESC'])
  ordering: SortOrdering = 'DESC';

  @ApiPropertyOptional({ enum: InvoiceStatusFilter, description: 'Filter by (derived) status' })
  @IsOptional()
  @IsEnum(InvoiceStatusFilter)
  status?: InvoiceStatusFilter;

  @ApiPropertyOptional({ description: 'Partial, case-insensitive search on invoice number or customer name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  keyword?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'invoiceDate on/after (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'fromDate must be a valid date (YYYY-MM-DD)' })
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'invoiceDate on/before (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'toDate must be a valid date (YYYY-MM-DD)' })
  toDate?: string;
}
