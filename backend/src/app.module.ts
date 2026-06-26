import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { dataSourceOptions } from './database/data-source';
import { InvoicesModule } from './invoices/invoices.module';
import { UsersModule } from './users/users.module';

/**
 * Root application module.
 *
 * - ConfigModule is global and validates the environment at startup (fail-fast).
 * - TypeOrmModule reuses the same dataSourceOptions as the CLI so runtime and
 *   migrations never diverge.
 * - Feature modules: Auth, Users, Invoices.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    AuthModule,
    InvoicesModule,
  ],
})
export class AppModule {}
