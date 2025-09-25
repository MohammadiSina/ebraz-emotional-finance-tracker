import { join } from 'node:path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { InsightsModule } from './insights/insights.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({ connection: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379 } }),
    BullBoardModule.forRoot({ route: '/bull-board', adapter: ExpressAdapter }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    AnalyticsModule,
    ExchangeRatesModule,
    InsightsModule,
  ],
})
export class AppModule {}
