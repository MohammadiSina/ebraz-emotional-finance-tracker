import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { join } from 'node:path';

import { InsightsService } from './insights.service';
import { PrismaService } from '../../common/services/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { QueryInsightPeriodInput } from '../dto/query-insight-period.input';
import { INSIGHTS_CONSTANT } from '../constants/insights.constant';

// Mock fs module
jest.mock('node:fs');
jest.mock('node:path');

// Mock OpenAI
jest.mock('openai');

describe('InsightsService', () => {
  let service: InsightsService;
  let prismaService: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let insightsQueue: jest.Mocked<Queue>;
  let configService: jest.Mocked<ConfigService>;
  let mockOpenAI: jest.Mocked<OpenAI>;

  // Mock data
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
  };

  const mockInsight = {
    id: 'insight-1',
    userId: 'user-1',
    period: '2025-09',
    content: 'Generated insight content',
    llmModel: 'gpt-4',
    llmRequestId: 'req-123',
    createdAt: new Date('2025-09-01T00:00:00Z'),
    updatedAt: new Date('2025-09-01T00:00:00Z'),
  };

  const mockTransaction = {
    id: 'transaction-1',
    userId: 'user-1',
    amount: 100,
    description: 'Test transaction',
    type: 'EXPENSE' as any,
    occurredAt: new Date('2025-09-01T00:00:00Z'),
  };

  const mockAnalyticsData = {
    netBalance: { usd: 1000, irt: 42000000 },
    period: '2025-09',
    totalIncome: { usd: 2000, irt: 84000000 },
    totalExpense: { usd: 1000, irt: 42000000 },
  };

  const mockOpenAIResponse = {
    id: 'req-123',
    model: 'gpt-4',
    output_text: 'Generated insight content',
    error: null,
    incomplete_details: null,
  };

  const mockQueryInsightPeriodInput: QueryInsightPeriodInput = {
    period: '2025-09',
  };

  beforeEach(async () => {
    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue('Mock system prompt');

    // Mock join
    (join as jest.Mock).mockReturnValue('/mock/path/prompt.md');

    // Mock OpenAI
    const mockOpenAIInstance = {
      responses: {
        create: jest.fn(),
      },
    };
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance as any);
    mockOpenAI = mockOpenAIInstance as any;

    const mockPrismaService = {
      insight: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    } as any;

    const mockUsersService = {
      findUsersEligibleForInsights: jest.fn(),
    };

    const mockTransactionsService = {
      findTopExpenseTransactions: jest.fn(),
    };

    const mockAnalyticsService = {
      getNetBalance: jest.fn(),
    };

    const mockInsightsQueue = {
      add: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'OPENAI_API_KEY':
            return 'mock-api-key';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: 'BullQueue_insights',
          useValue: mockInsightsQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
    prismaService = module.get(PrismaService);
    usersService = module.get(UsersService);
    transactionsService = module.get(TransactionsService);
    analyticsService = module.get(AnalyticsService);
    insightsQueue = module.get('BullQueue_insights');
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should generate insight successfully', async () => {
      const userId = 'user-1';
      transactionsService.findTopExpenseTransactions.mockResolvedValue([mockTransaction]);
      analyticsService.getNetBalance.mockResolvedValue(mockAnalyticsData);
      (mockOpenAI.responses.create as jest.Mock).mockResolvedValue(mockOpenAIResponse);
      (prismaService.insight.create as jest.Mock).mockResolvedValue(mockInsight);

      await service.generate(userId);

      expect(transactionsService.findTopExpenseTransactions).toHaveBeenCalledWith(userId);
      expect(analyticsService.getNetBalance).toHaveBeenCalledWith(userId);
      expect(mockOpenAI.responses.create as jest.Mock).toHaveBeenCalledWith({
        model: 'gpt-4',
        instructions: 'Mock system prompt',
        input: `period: ${mockAnalyticsData.period}, netBalance: ${mockAnalyticsData.netBalance}, transactions: ${JSON.stringify([mockTransaction])}`,
      });
      expect(prismaService.insight.create as jest.Mock).toHaveBeenCalledWith({
        data: {
          userId,
          period: mockAnalyticsData.period,
          llmModel: mockOpenAIResponse.model,
          content: mockOpenAIResponse.output_text,
          llmRequestId: mockOpenAIResponse.id,
        },
      });
    });

    it('should handle OpenAI errors', async () => {
      const userId = 'user-1';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      transactionsService.findTopExpenseTransactions.mockResolvedValue([mockTransaction]);
      analyticsService.getNetBalance.mockResolvedValue(mockAnalyticsData);

      const errorResponse = {
        ...mockOpenAIResponse,
        error: { message: 'OpenAI API error' },
        incomplete_details: { reason: 'content_filter' },
      };
      (mockOpenAI.responses.create as jest.Mock).mockResolvedValue(errorResponse);
      (prismaService.insight.create as jest.Mock).mockResolvedValue(mockInsight);

      await service.generate(userId);

      expect(consoleSpy).toHaveBeenCalledWith('GENERATE: OpenAI Error', errorResponse.error);
      expect(prismaService.insight.create).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      const userId = 'user-1';
      const error = new Error('Service error');
      transactionsService.findTopExpenseTransactions.mockRejectedValue(error);

      await expect(service.generate(userId)).rejects.toThrow(error);
    });
  });

  describe('generateMany', () => {
    it('should generate insights for all eligible users', async () => {
      const eligibleUsers = [mockUser, { id: 'user-2', email: 'user2@example.com' }];
      usersService.findUsersEligibleForInsights.mockResolvedValue(eligibleUsers);
      insightsQueue.add.mockResolvedValue({} as any);

      await service.generateMany();

      expect(usersService.findUsersEligibleForInsights).toHaveBeenCalledWith(
        INSIGHTS_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS.MIN,
      );
      expect(insightsQueue.add).toHaveBeenCalledTimes(2);
      expect(insightsQueue.add).toHaveBeenCalledWith(
        'generate',
        { userId: 'user-1' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      expect(insightsQueue.add).toHaveBeenCalledWith(
        'generate',
        { userId: 'user-2' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    });

    it('should handle empty eligible users list', async () => {
      usersService.findUsersEligibleForInsights.mockResolvedValue([]);

      await service.generateMany();

      expect(usersService.findUsersEligibleForInsights).toHaveBeenCalledWith(
        INSIGHTS_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS.MIN,
      );
      expect(insightsQueue.add).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.findUsersEligibleForInsights.mockRejectedValue(error);

      await expect(service.generateMany()).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return insights with default pagination', async () => {
      const userId = 'user-1';
      const insights = [mockInsight];
      (prismaService.insight.findMany as jest.Mock).mockResolvedValue(insights);

      const result = await service.findAll(userId);

      expect(prismaService.insight.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 3,
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, userId: true, period: true, content: true, createdAt: true },
      });
      expect(result).toEqual(insights);
    });

    it('should return insights with custom pagination', async () => {
      const userId = 'user-1';
      const queryInput: QueryOptionInput = { page: 2, take: 5 };
      const insights = [mockInsight];
      (prismaService.insight.findMany as jest.Mock).mockResolvedValue(insights);

      const result = await service.findAll(userId, queryInput);

      expect(prismaService.insight.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { userId },
        skip: 5, // (page - 1) * take = (2 - 1) * 5 = 5
        take: 5,
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, userId: true, period: true, content: true, createdAt: true },
      });
      expect(result).toEqual(insights);
    });

    it('should return empty array when no insights found', async () => {
      const userId = 'user-1';
      (prismaService.insight.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const userId = 'user-1';
      const error = new Error('Service error');
      (prismaService.insight.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.findAll(userId)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return insight by id and userId', async () => {
      const id = 'insight-1';
      const userId = 'user-1';
      (prismaService.insight.findUnique as jest.Mock).mockResolvedValue(mockInsight);

      const result = await service.findOne(id, userId);

      expect(prismaService.insight.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id, userId },
        select: { id: true, userId: true, period: true, content: true, createdAt: true },
      });
      expect(result).toEqual(mockInsight);
    });

    it('should throw NotFoundException when insight not found', async () => {
      const id = 'insight-1';
      const userId = 'user-1';
      (prismaService.insight.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(id, userId)).rejects.toThrow(
        new NotFoundException(INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(id)),
      );
    });

    it('should handle service errors', async () => {
      const id = 'insight-1';
      const userId = 'user-1';
      const error = new Error('Service error');
      (prismaService.insight.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.findOne(id, userId)).rejects.toThrow(error);
    });
  });

  describe('findByPeriod', () => {
    it('should return insight by period and userId', async () => {
      const userId = 'user-1';
      (prismaService.insight.findUnique as jest.Mock).mockResolvedValue(mockInsight);

      const result = await service.findByPeriod(mockQueryInsightPeriodInput, userId);

      expect(prismaService.insight.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { userId_period: { userId, period: mockQueryInsightPeriodInput.period } },
        select: { id: true, userId: true, period: true, content: true, createdAt: true },
      });
      expect(result).toEqual(mockInsight);
    });

    it('should throw NotFoundException when insight not found by period', async () => {
      const userId = 'user-1';
      (prismaService.insight.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findByPeriod(mockQueryInsightPeriodInput, userId)).rejects.toThrow(
        new NotFoundException(INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(mockQueryInsightPeriodInput.period)),
      );
    });

    it('should handle service errors', async () => {
      const userId = 'user-1';
      const error = new Error('Service error');
      (prismaService.insight.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.findByPeriod(mockQueryInsightPeriodInput, userId)).rejects.toThrow(error);
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize OpenAI with correct configuration', () => {
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'mock-api-key' });
    });

    it('should read system prompt from file', () => {
      expect(fs.readFileSync).toHaveBeenCalledWith('/mock/path/prompt.md', 'utf8');
      expect(join).toHaveBeenCalledWith(__dirname, '..', 'prompts', 'generate-insight.prompt.md');
    });

    it('should get OpenAI model from config', () => {
      expect(configService.get).toHaveBeenCalledWith('OPENAI_MODEL');
    });
  });
});
