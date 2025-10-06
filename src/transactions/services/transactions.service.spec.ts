import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionIntent,
  TransactionEmotion,
  TransactionCurrency,
} from 'generated/prisma';

import { AnalyticsService } from '../../analytics/services/analytics.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ExchangeRatesService } from '../../exchange-rates/services/exchange-rates.service';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';
import { CreateTransactionInput } from '../dto/create-transaction.input';
import { QueryTransactionInput } from '../dto/query-transaction.input';
import { UpdateTransactionInput } from '../dto/update-transaction.input';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let exchangeRatesService: jest.Mocked<ExchangeRatesService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let cacheManager: jest.Mocked<any>;

  const mockTransaction: Transaction = {
    id: 'test-transaction-id',
    userId: 'test-user-id',
    type: TransactionType.EXPENSE,
    currency: TransactionCurrency.IRT,
    amount: 100000,
    amountInUsd: 2.5,
    exchangeRate: 40000,
    category: TransactionCategory.DAILY_EXPENSES,
    intent: TransactionIntent.PLANNED,
    emotion: TransactionEmotion.SATISFACTION,
    note: 'Test transaction',
    occurredAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCreateTransactionInput: CreateTransactionInput = {
    type: TransactionType.EXPENSE,
    amount: 100000,
    exchangeRate: 40000,
    category: TransactionCategory.DAILY_EXPENSES,
    intent: TransactionIntent.PLANNED,
    emotion: TransactionEmotion.SATISFACTION,
    note: 'Test transaction',
    occurredAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      transaction: {
        create: jest.fn().mockResolvedValue(mockTransaction),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(mockTransaction),
        groupBy: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(mockTransaction),
        delete: jest.fn().mockResolvedValue(mockTransaction),
      },
    };

    const mockExchangeRatesService = {
      getUsdIrtExchangeRate: jest.fn(),
    };

    const mockAnalyticsService = {
      invalidateUserAnalyticsCache: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ExchangeRatesService,
          useValue: mockExchangeRatesService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get(PrismaService);
    exchangeRatesService = module.get(ExchangeRatesService);
    analyticsService = module.get(AnalyticsService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction with provided exchange rate', async () => {
      const userId = 'test-user-id';
      const input = { ...mockCreateTransactionInput, exchangeRate: 40000 };

      (prismaService.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      const result = await service.create(input, userId);

      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId,
          exchangeRate: 40000,
          amountInUsd: 2.5,
        },
      });
      expect(analyticsService.invalidateUserAnalyticsCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTransaction);
    });

    it('should create a transaction with fetched exchange rate when not provided', async () => {
      const userId = 'test-user-id';
      const input = { ...mockCreateTransactionInput };
      delete input.exchangeRate;

      exchangeRatesService.getUsdIrtExchangeRate.mockResolvedValue(40000);
      (prismaService.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      const result = await service.create(input, userId);

      expect(exchangeRatesService.getUsdIrtExchangeRate).toHaveBeenCalled();
      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId,
          exchangeRate: 40000,
          amountInUsd: 2.5,
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should calculate amountInUsd correctly', async () => {
      const userId = 'test-user-id';
      const input = { ...mockCreateTransactionInput, amount: 200000, exchangeRate: 50000 };

      (prismaService.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      await service.create(input, userId);

      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amountInUsd: 4.0, // 200000 / 50000 = 4.0
        }),
      });
    });
  });

  describe('findAll', () => {
    const userId = 'test-user-id';

    it('should return cached result when available', async () => {
      const cachedResult = [mockTransaction];
      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(userId);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database and cache result when not cached', async () => {
      const transactions = [mockTransaction];
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAll(userId);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 3,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toEqual(transactions);
    });

    it('should apply pagination correctly', async () => {
      const queryInput: QueryTransactionInput = { page: 2, take: 5 };
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.findAll(userId, queryInput);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 5, // (page - 1) * take = (2 - 1) * 5 = 5
        take: 5,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should apply filters correctly', async () => {
      const queryInput: QueryTransactionInput = {
        category: TransactionCategory.DAILY_EXPENSES,
        intent: TransactionIntent.PLANNED,
        emotion: TransactionEmotion.SATISFACTION,
        occurredAt: new Date('2024-01-01'),
        minAmount: 1000,
        maxAmount: 100000,
        minAmountInUsd: 0.1,
        maxAmountInUsd: 2.5,
      };

      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.findAll(userId, queryInput);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          category: TransactionCategory.DAILY_EXPENSES,
          intent: TransactionIntent.PLANNED,
          emotion: TransactionEmotion.SATISFACTION,
          occurredAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          amount: { gte: 1000, lte: 100000 },
          amountInUsd: { gte: 0.1, lte: 2.5 },
        },
        skip: 0,
        take: 3,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    const userId = 'test-user-id';
    const transactionId = 'test-transaction-id';

    it('should return cached result when available', async () => {
      cacheManager.get.mockResolvedValue(mockTransaction);

      const result = await service.findOne(transactionId, userId);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should fetch from database and cache result when not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.findOne(transactionId, userId);

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId, userId },
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(transactionId, userId)).rejects.toThrow(
        new NotFoundException(TRANSACTION_CONSTANT.ERROR.TRANSACTION_NOT_FOUND(transactionId)),
      );
    });
  });

  describe('findTopExpenseTransactions', () => {
    const userId = 'test-user-id';
    const period = '2024-01';

    it('should return cached result when available', async () => {
      const cachedResult = [mockTransaction];
      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findTopExpenseTransactions(userId, period);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database and cache result when not cached', async () => {
      const transactions = [mockTransaction];
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.findTopExpenseTransactions(userId, period);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        },
        orderBy: [{ amount: 'desc' }, { occurredAt: 'asc' }],
        take: TRANSACTION_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS.MAX,
        select: {
          category: true,
          amount: true,
          amountInUsd: true,
          intent: true,
          emotion: true,
          note: true,
          occurredAt: true,
        },
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toEqual(transactions);
    });

    it('should work without period parameter', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);
      cacheManager.set.mockResolvedValue(undefined);

      await service.findTopExpenseTransactions(userId);

      expect(prismaService.transaction.findMany).toHaveBeenCalled();
    });
  });

  describe('findUsersWithMinimumTransactions', () => {
    it('should return users with minimum transactions', async () => {
      const minInsightTransactions = 5;
      const period = '2024-01';
      const mockResult = [{ userId: 'user1', _count: { userId: 10 } }];

      (prismaService.transaction.groupBy as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findUsersWithMinimumTransactions(minInsightTransactions, period);

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: {
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
          type: TransactionType.EXPENSE,
        },
        _count: { userId: true },
        having: { userId: { _count: { gte: minInsightTransactions } } },
        orderBy: { _count: { userId: 'desc' } },
      });
      expect(result).toEqual(mockResult);
    });

    it('should work without period parameter', async () => {
      const minInsightTransactions = 5;
      (prismaService.transaction.groupBy as jest.Mock).mockResolvedValue([]);

      await service.findUsersWithMinimumTransactions(minInsightTransactions);

      expect(prismaService.transaction.groupBy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const userId = 'test-user-id';
    const transactionId = 'test-transaction-id';

    it('should update transaction without amount changes', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        note: 'Updated note',
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.transaction.update as jest.Mock).mockResolvedValue({ ...mockTransaction, ...updateInput });
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      const result = await service.update(transactionId, userId, updateInput);

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: updateInput,
      });
      expect(analyticsService.invalidateUserAnalyticsCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ ...mockTransaction, ...updateInput });
    });

    it('should update transaction with amount changes and recalculate amountInUsd', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        amount: 200000,
        exchangeRate: 50000,
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.transaction.update as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        ...updateInput,
        amountInUsd: 4.0,
      });
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      const result = await service.update(transactionId, userId, updateInput);

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: {
          ...updateInput,
          amountInUsd: 4.0, // 200000 / 50000 = 4.0
        },
      });
      expect(result).toEqual({ ...mockTransaction, ...updateInput, amountInUsd: 4.0 });
    });

    it('should fetch exchange rate when amount changes but exchange rate not provided', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        amount: 200000,
      };

      exchangeRatesService.getUsdIrtExchangeRate.mockResolvedValue(50000);
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.transaction.update as jest.Mock).mockResolvedValue({ ...mockTransaction, ...updateInput });
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      await service.update(transactionId, userId, updateInput);

      expect(exchangeRatesService.getUsdIrtExchangeRate).toHaveBeenCalled();
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: {
          ...updateInput,
          exchangeRate: 50000,
          amountInUsd: 4.0, // 200000 / 50000 = 4.0
        },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        note: 'Updated note',
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(transactionId, userId, updateInput)).rejects.toThrow(
        new NotFoundException(TRANSACTION_CONSTANT.ERROR.TRANSACTION_NOT_FOUND(transactionId)),
      );
    });
  });

  describe('remove', () => {
    const userId = 'test-user-id';
    const transactionId = 'test-transaction-id';

    it('should delete transaction successfully', async () => {
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.transaction.delete as jest.Mock).mockResolvedValue(mockTransaction);
      analyticsService.invalidateUserAnalyticsCache.mockResolvedValue(undefined);

      const result = await service.remove(transactionId, userId);

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId, userId },
      });
      expect(prismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
      expect(analyticsService.invalidateUserAnalyticsCache).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(transactionId, userId)).rejects.toThrow(
        new NotFoundException(TRANSACTION_CONSTANT.ERROR.TRANSACTION_NOT_FOUND(transactionId)),
      );
    });
  });

  describe('buildQueryFilters', () => {
    it('should build basic filters with userId only', () => {
      const result = (service as any).buildQueryFilters('test-user-id');

      expect(result).toEqual({ userId: 'test-user-id' });
    });

    it('should build filters with all query parameters', () => {
      const queryInput: QueryTransactionInput = {
        category: TransactionCategory.DAILY_EXPENSES,
        intent: TransactionIntent.PLANNED,
        emotion: TransactionEmotion.SATISFACTION,
        occurredAt: new Date('2024-01-01'),
        minAmount: 1000,
        maxAmount: 100000,
        minAmountInUsd: 0.1,
        maxAmountInUsd: 2.5,
      };

      const result = (service as any).buildQueryFilters('test-user-id', queryInput);

      expect(result).toEqual({
        userId: 'test-user-id',
        category: TransactionCategory.DAILY_EXPENSES,
        intent: TransactionIntent.PLANNED,
        emotion: TransactionEmotion.SATISFACTION,
        occurredAt: {
          gte: expect.any(Date),
          lte: expect.any(Date),
        },
        amount: { gte: 1000, lte: 100000 },
        amountInUsd: { gte: 0.1, lte: 2.5 },
      });
    });

    it('should handle partial amount filters', () => {
      const queryInput: QueryTransactionInput = {
        minAmount: 1000,
      };

      const result = (service as any).buildQueryFilters('test-user-id', queryInput);

      expect(result).toEqual({
        userId: 'test-user-id',
        amount: { gte: 1000 },
      });
    });
  });

  describe('generateFiltersString', () => {
    it('should return empty string for undefined input', () => {
      const result = (service as any).generateFiltersString();

      expect(result).toBe('');
    });

    it('should generate filters string for all parameters', () => {
      const queryInput: QueryTransactionInput = {
        category: TransactionCategory.DAILY_EXPENSES,
        intent: TransactionIntent.PLANNED,
        emotion: TransactionEmotion.SATISFACTION,
        occurredAt: new Date('2024-01-01'),
        minAmount: 1000,
        maxAmount: 100000,
        minAmountInUsd: 0.1,
        maxAmountInUsd: 2.5,
      };

      const result = (service as any).generateFiltersString(queryInput);

      expect(result).toBe(
        'cat:DAILY_EXPENSES|int:PLANNED|emo:SATISFACTION|date:2024-01-01|minAmt:1000|maxAmt:100000|minUsd:0.1|maxUsd:2.5',
      );
    });

    it('should generate filters string for partial parameters', () => {
      const queryInput: QueryTransactionInput = {
        category: TransactionCategory.DAILY_EXPENSES,
        minAmount: 1000,
      };

      const result = (service as any).generateFiltersString(queryInput);

      expect(result).toBe('cat:DAILY_EXPENSES|minAmt:1000');
    });
  });

  describe('getCacheKey', () => {
    it('should generate cache key without additional params', () => {
      const result = (service as any).getCacheKey('test-user-id', 'findOne');

      expect(result).toBe('ebraz:transactions:findOne:test-user-id');
    });

    it('should generate cache key with additional params', () => {
      const result = (service as any).getCacheKey('test-user-id', 'findOne', 'test-id');

      expect(result).toBe('ebraz:transactions:findOne:test-user-id:test-id');
    });
  });

  describe('getPaginatedCacheKey', () => {
    it('should generate paginated cache key without filters', () => {
      const result = (service as any).getPaginatedCacheKey('test-user-id', 'findAll', 1, 10);

      expect(result).toBe('ebraz:transactions:findAll:test-user-id:1:10');
    });

    it('should generate paginated cache key with filters', () => {
      const result = (service as any).getPaginatedCacheKey('test-user-id', 'findAll', 1, 10, 'cat:DAILY_EXPENSES');

      expect(result).toBe('ebraz:transactions:findAll:test-user-id:1:10:cat:DAILY_EXPENSES');
    });
  });
});
