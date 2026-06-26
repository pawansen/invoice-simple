import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceResponseDto,
  PaginatedInvoicesResponseDto,
} from './dto/invoice-response.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceInput } from './types/create-invoice.input';
import { FindInvoicesQuery } from './types/find-invoices.query';

@ApiTags('Invoices')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with search, filter, sort and pagination' })
  @ApiOkResponse({ type: PaginatedInvoicesResponseDto })
  findAll(@Query() query: QueryInvoicesDto): Promise<PaginatedInvoicesResponseDto> {
    const normalised: FindInvoicesQuery = {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      ordering: query.ordering,
      status: query.status,
      keyword: query.keyword,
      fromDate: query.fromDate,
      toDate: query.toDate,
    };
    return this.invoicesService.findAll(normalised) as Promise<PaginatedInvoicesResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail by id' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiBadRequestResponse({ description: 'Invalid invoice id' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(id) as Promise<InvoiceResponseDto>;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice (always created as Draft)' })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed (e.g. dueDate before invoiceDate)' })
  @ApiConflictResponse({ description: 'Invoice number already exists' })
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser('id') userId: string,
  ): Promise<InvoiceResponseDto> {
    const input: CreateInvoiceInput = {
      invoiceNumber: dto.invoiceNumber,
      invoiceReference: dto.invoiceReference ?? null,
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      currencySymbol: dto.currencySymbol ?? null,
      description: dto.description ?? null,
      taxPercent: dto.taxPercent,
      discount: dto.discount,
      customer: {
        fullname: dto.customer.fullname,
        email: dto.customer.email,
        mobileNumber: dto.customer.mobileNumber ?? null,
        address: dto.customer.address ?? null,
      },
      item: {
        name: dto.item.name,
        quantity: dto.item.quantity,
        rate: dto.item.rate,
      },
    };
    return this.invoicesService.create(input, userId) as Promise<InvoiceResponseDto>;
  }
}
