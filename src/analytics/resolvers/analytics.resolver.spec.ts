import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'generated/prisma';

import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from '../services/analytics.service';
import { QueryAnalyticsPeriodInput } from '../dto/query-analytics-period.input';
import { QueryAnalyticsTopTransactionsInput } from '../dto/query-analytics-top-transactions.input';
import { User } from '../../users/entities/user.entity';

describe('AnalyticsResolver', () => {
  let resolver: AnalyticsResolver;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: UserRole.USER,
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNetBalanceOutput = {
    period: '2024-01',
    netBalance: { irt: 6000000, usd: 150 },
    totalIncome: { irt: 10000000, usd: 250 },
    totalExpense: { irt: 4000000, usd: 100 },
  };

  const mockSpendingBreakdownOutput = {
    period: '2024-01',
    categories: [],
    grandTotalIrt: 0,
    grandTotalUsd: 0,
  };

  const mockIntentBreakdownOutput = {
    period: '2024-01',
    intents: [],
    grandTotalIrt: 0,
    grandTotalUsd: 0,
  };

  const mockEmotionBreakdownOutput = {
    period: '2024-01',
    emotions: [],
    grandTotalIrt: 0,
    grandTotalUsd: 0,
  };

  const mockSavingsRateOutput = {
    period: '2024-01',
    savingsRatePercent: 60,
    totalIncome: { irt: 10000000, usd: 250 },
    totalExpense: { irt: 4000000, usd: 100 },
    savingsAmount: { irt: 6000000, usd: 150 },
  };

  const mockTopTransactionsOutput = {
    period: '2024-01',
    transactions: [],
  };

  beforeEach(async () => {
    const mockAnalyticsService = {
      getNetBalance: jest.fn(),
      getSpendingBreakdown: jest.fn(),
      getIntentBreakdown: jest.fn(),
      getEmotionBreakdown: jest.fn(),
      getSavingsRate: jest.fn(),
      getTopTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsResolver,
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    resolver = module.get<AnalyticsResolver>(AnalyticsResolver);
    analyticsService = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getNetBalance', () => {
    it('should call analyticsService.getNetBalance with user id and period', async () => {
      const input: QueryAnalyticsPeriodInput = { period: '2024-01' };
      analyticsService.getNetBalance.mockResolvedValue(mockNetBalanceOutput);

      const result = await resolver.getNetBalance(mockUser, input);

      expect(analyticsService.getNetBalance).toHaveBeenCalledWith(mockUser.id, input.period);
      expect(result).toEqual(mockNetBalanceOutput);
    });

    it('should work without input parameter', async () => {
      analyticsService.getNetBalance.mockResolvedValue(mockNetBalanceOutput);

      const result = await resolver.getNetBalance(mockUser, undefined);

      expect(analyticsService.getNetBalance).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockNetBalanceOutput);
    });

    it('should work with input containing undefined period', async () => {
      const input: QueryAnalyticsPeriodInput = {};
      analyticsService.getNetBalance.mockResolvedValue(mockNetBalanceOutput);

      const result = await resolver.getNetBalance(mockUser, input);

      expect(analyticsService.getNetBalance).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockNetBalanceOutput);
    });
  });

  describe('getSpendingBreakdown', () => {
    it('should call analyticsService.getSpendingBreakdown with user id and period', async () => {
      const input: QueryAnalyticsPeriodInput = { period: '2024-01' };
      analyticsService.getSpendingBreakdown.mockResolvedValue(mockSpendingBreakdownOutput);

      const result = await resolver.getSpendingBreakdown(input, mockUser);

      expect(analyticsService.getSpendingBreakdown).toHaveBeenCalledWith(mockUser.id, input.period);
      expect(result).toEqual(mockSpendingBreakdownOutput);
    });

    it('should work without period in input', async () => {
      const input: QueryAnalyticsPeriodInput = {};
      analyticsService.getSpendingBreakdown.mockResolvedValue(mockSpendingBreakdownOutput);

      const result = await resolver.getSpendingBreakdown(input, mockUser);

      expect(analyticsService.getSpendingBreakdown).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockSpendingBreakdownOutput);
    });
  });

  describe('getIntentBreakdown', () => {
    it('should call analyticsService.getIntentBreakdown with user id and period', async () => {
      const input: QueryAnalyticsPeriodInput = { period: '2024-01' };
      analyticsService.getIntentBreakdown.mockResolvedValue(mockIntentBreakdownOutput);

      const result = await resolver.getIntentBreakdown(input, mockUser);

      expect(analyticsService.getIntentBreakdown).toHaveBeenCalledWith(mockUser.id, input.period);
      expect(result).toEqual(mockIntentBreakdownOutput);
    });

    it('should work without period in input', async () => {
      const input: QueryAnalyticsPeriodInput = {};
      analyticsService.getIntentBreakdown.mockResolvedValue(mockIntentBreakdownOutput);

      const result = await resolver.getIntentBreakdown(input, mockUser);

      expect(analyticsService.getIntentBreakdown).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockIntentBreakdownOutput);
    });
  });

  describe('getEmotionBreakdown', () => {
    it('should call analyticsService.getEmotionBreakdown with user id and period', async () => {
      const input: QueryAnalyticsPeriodInput = { period: '2024-01' };
      analyticsService.getEmotionBreakdown.mockResolvedValue(mockEmotionBreakdownOutput);

      const result = await resolver.getEmotionBreakdown(input, mockUser);

      expect(analyticsService.getEmotionBreakdown).toHaveBeenCalledWith(mockUser.id, input.period);
      expect(result).toEqual(mockEmotionBreakdownOutput);
    });

    it('should work without period in input', async () => {
      const input: QueryAnalyticsPeriodInput = {};
      analyticsService.getEmotionBreakdown.mockResolvedValue(mockEmotionBreakdownOutput);

      const result = await resolver.getEmotionBreakdown(input, mockUser);

      expect(analyticsService.getEmotionBreakdown).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockEmotionBreakdownOutput);
    });
  });

  describe('getSavingsRate', () => {
    it('should call analyticsService.getSavingsRate with user id and period', async () => {
      const input: QueryAnalyticsPeriodInput = { period: '2024-01' };
      analyticsService.getSavingsRate.mockResolvedValue(mockSavingsRateOutput);

      const result = await resolver.getSavingsRate(input, mockUser);

      expect(analyticsService.getSavingsRate).toHaveBeenCalledWith(mockUser.id, input.period);
      expect(result).toEqual(mockSavingsRateOutput);
    });

    it('should work without period in input', async () => {
      const input: QueryAnalyticsPeriodInput = {};
      analyticsService.getSavingsRate.mockResolvedValue(mockSavingsRateOutput);

      const result = await resolver.getSavingsRate(input, mockUser);

      expect(analyticsService.getSavingsRate).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockSavingsRateOutput);
    });
  });

  describe('getTopTransactions', () => {
    it('should call analyticsService.getTopTransactions with user id, period, and take', async () => {
      const input: QueryAnalyticsTopTransactionsInput = { period: '2024-01', take: 10 };
      analyticsService.getTopTransactions.mockResolvedValue(mockTopTransactionsOutput);

      const result = await resolver.getTopTransactions(input, mockUser);

      expect(analyticsService.getTopTransactions).toHaveBeenCalledWith(mockUser.id, input.period, input.take);
      expect(result).toEqual(mockTopTransactionsOutput);
    });

    it('should work without period and take in input', async () => {
      const input: QueryAnalyticsTopTransactionsInput = {};
      analyticsService.getTopTransactions.mockResolvedValue(mockTopTransactionsOutput);

      const result = await resolver.getTopTransactions(input, mockUser);

      expect(analyticsService.getTopTransactions).toHaveBeenCalledWith(mockUser.id, undefined, undefined);
      expect(result).toEqual(mockTopTransactionsOutput);
    });

    it('should work with only period in input', async () => {
      const input: QueryAnalyticsTopTransactionsInput = { period: '2024-01' };
      analyticsService.getTopTransactions.mockResolvedValue(mockTopTransactionsOutput);

      const result = await resolver.getTopTransactions(input, mockUser);

      expect(analyticsService.getTopTransactions).toHaveBeenCalledWith(mockUser.id, input.period, undefined);
      expect(result).toEqual(mockTopTransactionsOutput);
    });

    it('should work with only take in input', async () => {
      const input: QueryAnalyticsTopTransactionsInput = { take: 5 };
      analyticsService.getTopTransactions.mockResolvedValue(mockTopTransactionsOutput);

      const result = await resolver.getTopTransactions(input, mockUser);

      expect(analyticsService.getTopTransactions).toHaveBeenCalledWith(mockUser.id, undefined, input.take);
      expect(result).toEqual(mockTopTransactionsOutput);
    });
  });
});
