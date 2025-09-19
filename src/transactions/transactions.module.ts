import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { TransactionsResolver } from './resolvers/transactions.resolver';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [AuthModule, ExchangeRatesModule],
  providers: [TransactionsResolver, TransactionsService],
})
export class TransactionsModule {}
