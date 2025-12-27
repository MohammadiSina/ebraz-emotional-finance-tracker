import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TransactionType, TransactionCategory, TransactionIntent, TransactionEmotion } from 'generated/prisma';

import { PrismaService } from '../../common/services/prisma.service';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheManager: jest.Mocked<Cache>;

  const userId = 'test-user-id';
  const period = '2024-01';

  const mockIncomeTransaction = {
    type: TransactionType.INCOME,
    amount: 10000000,
    amountInUsd: 250,
  };

  const mockExpenseTransaction = {
    type: TransactionType.EXPENSE,
    amount: 4000000,
    amountInUsd: 100,
    category: TransactionCategory.DAILY_EXPENSES,
    intent: TransactionIntent.PLANNED,
    emotion: TransactionEmotion.SATISFACTION,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      transaction: {
        findMany: jest.fn(),
      },
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNetBalance', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        netBalance: { irt: 6000000, usd: 150 },
        totalIncome: { irt: 10000000, usd: 250 },
        totalExpense: { irt: 4000000, usd: 100 },
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getNetBalance(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should calculate net balance from database when not cached', async () => {
      const transactions = [mockIncomeTransaction, { ...mockExpenseTransaction, amount: 4000000, amountInUsd: 100 }];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getNetBalance(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        },
        select: {
          type: true,
          amount: true,
          amountInUsd: true,
        },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('netBalance'),
        expect.any(Object),
        ANALYTICS_CONSTANT.CACHE.TTL.NET_BALANCE,
      );
      expect(result.period).toBe(period);
      expect(result.totalIncome.irt).toBe(10000000);
      expect(result.totalIncome.usd).toBe(250);
      expect(result.totalExpense.irt).toBe(4000000);
      expect(result.totalExpense.usd).toBe(100);
      expect(result.netBalance.irt).toBe(6000000);
      expect(result.netBalance.usd).toBe(150);
    });

    it('should work without period parameter (current month)', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getNetBalance(userId);

      expect(prismaService.transaction.findMany).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle multiple income and expense transactions', async () => {
      const transactions = [
        { ...mockIncomeTransaction, amount: 5000000, amountInUsd: 125 },
        { ...mockIncomeTransaction, amount: 3000000, amountInUsd: 75 },
        { ...mockExpenseTransaction, amount: 2000000, amountInUsd: 50 },
        { ...mockExpenseTransaction, amount: 1000000, amountInUsd: 25 },
      ];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getNetBalance(userId, period);

      expect(result.totalIncome.irt).toBe(8000000);
      expect(result.totalIncome.usd).toBe(200);
      expect(result.totalExpense.irt).toBe(3000000);
      expect(result.totalExpense.usd).toBe(75);
      expect(result.netBalance.irt).toBe(5000000);
      expect(result.netBalance.usd).toBe(125);
    });

    it('should handle zero income correctly', async () => {
      const transactions = [mockExpenseTransaction];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getNetBalance(userId, period);

      expect(result.totalIncome.irt).toBe(0);
      expect(result.totalIncome.usd).toBe(0);
      expect(result.netBalance.irt).toBe(-4000000);
      expect(result.netBalance.usd).toBe(-100);
    });
  });

  describe('getSpendingBreakdown', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        categories: [],
        grandTotalIrt: 0,
        grandTotalUsd: 0,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getSpendingBreakdown(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should calculate spending breakdown by category when not cached', async () => {
      const transactions = [
        { ...mockExpenseTransaction, category: TransactionCategory.DAILY_EXPENSES, amount: 2000000, amountInUsd: 50 },
        { ...mockExpenseTransaction, category: TransactionCategory.DAILY_EXPENSES, amount: 1000000, amountInUsd: 25 },
        { ...mockExpenseTransaction, category: TransactionCategory.ENTERTAINMENT, amount: 1000000, amountInUsd: 25 },
      ];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getSpendingBreakdown(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
          type: TransactionType.EXPENSE,
        },
        select: {
          category: true,
          amount: true,
          amountInUsd: true,
        },
      });
      expect(result.period).toBe(period);
      expect(result.grandTotalIrt).toBe(4000000);
      expect(result.grandTotalUsd).toBe(100);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].category).toBe(TransactionCategory.DAILY_EXPENSES);
      expect(result.categories[0].totalIrt).toBe(3000000);
      expect(result.categories[0].totalUsd).toBe(75);
      expect(result.categories[0].percentage).toBe(75); // 3000000 / 4000000 * 100
      expect(result.categories[1].category).toBe(TransactionCategory.ENTERTAINMENT);
      expect(result.categories[1].totalIrt).toBe(1000000);
      expect(result.categories[1].totalUsd).toBe(25);
      expect(result.categories[1].percentage).toBe(25); // 1000000 / 4000000 * 100
    });

    it('should handle empty transactions', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getSpendingBreakdown(userId, period);

      expect(result.categories).toHaveLength(0);
      expect(result.grandTotalIrt).toBe(0);
      expect(result.grandTotalUsd).toBe(0);
    });
  });

  describe('getIntentBreakdown', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        intents: [],
        grandTotalIrt: 0,
        grandTotalUsd: 0,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getIntentBreakdown(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should calculate intent breakdown when not cached', async () => {
      const transactions = [
        { ...mockExpenseTransaction, intent: TransactionIntent.PLANNED, amount: 2000000, amountInUsd: 50 },
        { ...mockExpenseTransaction, intent: TransactionIntent.PLANNED, amount: 1000000, amountInUsd: 25 },
        { ...mockExpenseTransaction, intent: TransactionIntent.IMPULSIVE, amount: 1000000, amountInUsd: 25 },
      ];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getIntentBreakdown(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
          type: TransactionType.EXPENSE,
        },
        select: {
          intent: true,
          amount: true,
          amountInUsd: true,
        },
      });
      expect(result.period).toBe(period);
      expect(result.grandTotalIrt).toBe(4000000);
      expect(result.grandTotalUsd).toBe(100);
      expect(result.intents).toHaveLength(2);
      expect(result.intents[0].intent).toBe(TransactionIntent.PLANNED);
      expect(result.intents[0].totalIrt).toBe(3000000);
      expect(result.intents[0].totalUsd).toBe(75);
      expect(result.intents[0].percentage).toBe(75);
      expect(result.intents[1].intent).toBe(TransactionIntent.IMPULSIVE);
      expect(result.intents[1].totalIrt).toBe(1000000);
      expect(result.intents[1].totalUsd).toBe(25);
      expect(result.intents[1].percentage).toBe(25);
    });
  });

  describe('getEmotionBreakdown', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        emotions: [],
        grandTotalIrt: 0,
        grandTotalUsd: 0,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getEmotionBreakdown(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should calculate emotion breakdown when not cached', async () => {
      const transactions = [
        { ...mockExpenseTransaction, emotion: TransactionEmotion.SATISFACTION, amount: 2000000, amountInUsd: 50 },
        { ...mockExpenseTransaction, emotion: TransactionEmotion.SATISFACTION, amount: 1000000, amountInUsd: 25 },
        { ...mockExpenseTransaction, emotion: TransactionEmotion.REGRET, amount: 1000000, amountInUsd: 25 },
      ];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getEmotionBreakdown(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
          type: TransactionType.EXPENSE,
        },
        select: {
          emotion: true,
          amount: true,
          amountInUsd: true,
        },
      });
      expect(result.period).toBe(period);
      expect(result.grandTotalIrt).toBe(4000000);
      expect(result.grandTotalUsd).toBe(100);
      expect(result.emotions).toHaveLength(2);
      expect(result.emotions[0].emotion).toBe(TransactionEmotion.SATISFACTION);
      expect(result.emotions[0].totalIrt).toBe(3000000);
      expect(result.emotions[0].totalUsd).toBe(75);
      expect(result.emotions[0].percentage).toBe(75);
      expect(result.emotions[1].emotion).toBe(TransactionEmotion.REGRET);
      expect(result.emotions[1].totalIrt).toBe(1000000);
      expect(result.emotions[1].totalUsd).toBe(25);
      expect(result.emotions[1].percentage).toBe(25);
    });
  });

  describe('getSavingsRate', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        savingsRatePercent: 60,
        totalIncome: { irt: 10000000, usd: 250 },
        totalExpense: { irt: 4000000, usd: 100 },
        savingsAmount: { irt: 6000000, usd: 150 },
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getSavingsRate(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should calculate savings rate from net balance when not cached', async () => {
      const netBalanceResult = {
        period: '2024-01',
        netBalance: { irt: 6000000, usd: 150 },
        totalIncome: { irt: 10000000, usd: 250 },
        totalExpense: { irt: 4000000, usd: 100 },
      };

      // Mock getNetBalance to return the result
      jest.spyOn(service, 'getNetBalance').mockResolvedValue(netBalanceResult);
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getSavingsRate(userId, period);

      expect(service.getNetBalance).toHaveBeenCalledWith(userId, period);
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('savingsRate'),
        expect.any(Object),
        ANALYTICS_CONSTANT.CACHE.TTL.SAVINGS_RATE,
      );
      expect(result.period).toBe('2024-01');
      expect(result.savingsRatePercent).toBe(60); // (10000000 - 4000000) / 10000000 * 100
      expect(result.totalIncome).toEqual(netBalanceResult.totalIncome);
      expect(result.totalExpense).toEqual(netBalanceResult.totalExpense);
      expect(result.savingsAmount).toEqual(netBalanceResult.netBalance);
    });

    it('should handle zero income correctly', async () => {
      const netBalanceResult = {
        period: '2024-01',
        netBalance: { irt: -4000000, usd: -100 },
        totalIncome: { irt: 0, usd: 0 },
        totalExpense: { irt: 4000000, usd: 100 },
      };

      jest.spyOn(service, 'getNetBalance').mockResolvedValue(netBalanceResult);
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getSavingsRate(userId, period);

      expect(result.savingsRatePercent).toBe(0);
    });

    it('should handle negative savings correctly', async () => {
      const netBalanceResult = {
        period: '2024-01',
        netBalance: { irt: -2000000, usd: -50 },
        totalIncome: { irt: 2000000, usd: 50 },
        totalExpense: { irt: 4000000, usd: 100 },
      };

      jest.spyOn(service, 'getNetBalance').mockResolvedValue(netBalanceResult);
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getSavingsRate(userId, period);

      expect(result.savingsRatePercent).toBe(-100); // (2000000 - 4000000) / 2000000 * 100
    });
  });

  describe('getTopTransactions', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        period: '2024-01',
        transactions: [],
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getTopTransactions(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch top transactions when not cached', async () => {
      const transactions = [
        {
          amount: 5000000,
          amountInUsd: 125,
          category: TransactionCategory.DAILY_EXPENSES,
          type: TransactionType.EXPENSE,
          note: 'Large expense',
          occurredAt: new Date('2024-01-15'),
        },
        {
          amount: 3000000,
          amountInUsd: 75,
          category: TransactionCategory.ENTERTAINMENT,
          type: TransactionType.EXPENSE,
          note: 'Medium expense',
          occurredAt: new Date('2024-01-10'),
        },
      ];

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.getTopTransactions(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        },
        orderBy: { amount: 'desc' },
        take: ANALYTICS_CONSTANT.DEFAULT_TOP_TRANSACTIONS_LIMIT,
        select: {
          amount: true,
          amountInUsd: true,
          category: true,
          type: true,
          note: true,
          occurredAt: true,
        },
      });
      expect(result.period).toBe(period);
      expect(result.transactions).toEqual(transactions);
    });

    it('should use custom take parameter', async () => {
      const take = 10;
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getTopTransactions(userId, period, take);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take,
        }),
      );
    });

    it('should work without period parameter', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getTopTransactions(userId);

      expect(prismaService.transaction.findMany).toHaveBeenCalled();
    });
  });

  describe('invalidateUserAnalyticsCache', () => {
    it('should be defined', async () => {
      await service.invalidateUserAnalyticsCache(userId);
      // Note: The current implementation doesn't actually delete cache entries
      // It's a placeholder for future implementation
      expect(service.invalidateUserAnalyticsCache).toBeDefined();
    });
  });

  describe('invalidateUserPeriodAnalyticsCache', () => {
    it('should delete cache entries for specific period', async () => {
      cacheManager.del.mockResolvedValue(true);

      await service.invalidateUserPeriodAnalyticsCache(userId, period);

      expect(cacheManager.del).toHaveBeenCalledTimes(5); // netBalance, spendingBreakdown, intentBreakdown, emotionBreakdown, savingsRate
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining(`netBalance:${userId}:${period}`));
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining(`spendingBreakdown:${userId}:${period}`));
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining(`intentBreakdown:${userId}:${period}`));
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining(`emotionBreakdown:${userId}:${period}`));
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining(`savingsRate:${userId}:${period}`));
    });

    it('should work without period parameter', async () => {
      cacheManager.del.mockResolvedValue(true);

      await service.invalidateUserPeriodAnalyticsCache(userId);

      expect(cacheManager.del).toHaveBeenCalledTimes(5);
    });
  });

  describe('getCacheKey', () => {
    it('should generate cache key correctly', () => {
      const key = (service as any).getCacheKey(userId, 'netBalance', period);

      expect(key).toBe(`${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}netBalance:${userId}:${period}`);
    });

    it('should generate cache key with additional params', () => {
      const key = (service as any).getCacheKey(userId, 'topTransactions', period, '10');

      expect(key).toBe(`${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}topTransactions:${userId}:${period}:10`);
    });

    it('should use current period when period is not provided', () => {
      const key = (service as any).getCacheKey(userId, 'netBalance');

      expect(key).toContain(`${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}netBalance:${userId}:`);
    });
  });
});
