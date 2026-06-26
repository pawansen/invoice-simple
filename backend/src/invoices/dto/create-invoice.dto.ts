import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Customer details captured with the invoice. */
export class CreateCustomerDto {
  @ApiProperty({ example: 'Paul' })
  @IsString()
  @IsNotEmpty({ message: 'customer name is required' })
  @MaxLength(255)
  fullname: string;

  @ApiProperty({ example: 'paul@101digital.io' })
  @IsEmail({}, { message: 'customer email must be a valid email address' })
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '947717364111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

/** The single line item for the invoice. */
export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Honda RC150' })
  @IsString()
  @IsNotEmpty({ message: 'item name is required' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 2, description: 'Positive integer quantity' })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be a positive integer' })
  quantity: number;

  @ApiProperty({ example: 1000, description: 'Positive unit rate' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'rate must be a number' })
  @IsPositive({ message: 'rate must be a positive number' })
  rate: number;
}

/** Request body for POST /invoices. */
export class CreateInvoiceDto {
  @ApiProperty({ example: 'IV1780488206995', description: 'Unique invoice number' })
  @IsString()
  @IsNotEmpty({ message: 'invoiceNumber is required' })
  @MaxLength(100)
  invoiceNumber: string;

  @ApiPropertyOptional({ example: '#5721662' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceReference?: string;

  @ApiProperty({ example: '2026-06-03', description: 'YYYY-MM-DD' })
  @Matches(DATE_REGEX, { message: 'invoiceDate must be a valid date (YYYY-MM-DD)' })
  invoiceDate: string;

  @ApiProperty({ example: '2026-07-03', description: 'YYYY-MM-DD, on or after invoiceDate' })
  @Matches(DATE_REGEX, { message: 'dueDate must be a valid date (YYYY-MM-DD)' })
  dueDate: string;

  @ApiProperty({ example: 'AUD', description: 'ISO 4217 currency code' })
  @IsString()
  @IsNotEmpty({ message: 'currency is required' })
  @MaxLength(3)
  currency: string;

  @ApiPropertyOptional({ example: 'AU$', description: 'Derived from currency when omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencySymbol?: string;

  @ApiPropertyOptional({ example: 'Invoice is issued to Kanglee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Tax percentage, defaults to 10' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'taxPercent must be a number' })
  @Min(0, { message: 'taxPercent must be a non-negative number' })
  taxPercent = 10;

  @ApiPropertyOptional({ example: 20, default: 0, description: 'Absolute discount, defaults to 0' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'discount must be a number' })
  @Min(0, { message: 'discount must be a non-negative number' })
  discount = 0;

  @ApiProperty({ type: CreateCustomerDto })
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @ApiProperty({ type: CreateInvoiceItemDto })
  @ValidateNested()
  @Type(() => CreateInvoiceItemDto)
  item: CreateInvoiceItemDto;
}
