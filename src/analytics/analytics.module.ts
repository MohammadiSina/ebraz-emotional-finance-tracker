import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [AuthModule],
  providers: [AnalyticsResolver, AnalyticsService],
})
export class AnalyticsModule {}
