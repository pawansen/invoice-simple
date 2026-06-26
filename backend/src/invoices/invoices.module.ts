import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

/**
 * Invoice feature module. Registers the REST controller, the service and its
 * repositories; the service is exported for reuse (e.g. by the seed script).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Customer])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
