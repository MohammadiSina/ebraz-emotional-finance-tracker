import { Test, TestingModule } from '@nestjs/testing';
import { InsightsService } from '../services/insights.service';
import { InsightsResolver } from './insights.resolver';

describe('InsightsResolver', () => {
  let resolver: InsightsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsightsResolver, InsightsService],
    }).compile();

    resolver = module.get<InsightsResolver>(InsightsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
