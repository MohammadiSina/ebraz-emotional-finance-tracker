import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { QueryOptionInput } from '../../common/dto/query-option.input';
import { User } from '../../users/entities/user.entity';
import { INSIGHTS_CONSTANT } from '../constants/insights.constant';
import { QueryInsightPeriodInput } from '../dto/query-insight-period.input';
import { Insight } from '../entities/insight.entity';
import { InsightsService } from '../services/insights.service';
import { InsightsResolver } from './insights.resolver';

describe('InsightsResolver', () => {
  let resolver: InsightsResolver;
  let insightsService: jest.Mocked<InsightsService>;

  // Mock data
  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER' as any,
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockInsight: Insight = {
    id: 'insight-1',
    userId: 'user-1',
    period: '2025-09',
    content: 'Generated insight content',
    llmModel: 'gpt-4',
    llmRequestId: 'req-123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockQueryOptionInput: QueryOptionInput = {
    page: 1,
    take: 10,
  };

  const mockQueryInsightPeriodInput: QueryInsightPeriodInput = {
    period: '2025-09',
  };

  beforeEach(async () => {
    const mockInsightsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPeriod: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsResolver,
        {
          provide: InsightsService,
          useValue: mockInsightsService,
        },
      ],
    }).compile();

    resolver = module.get<InsightsResolver>(InsightsResolver);
    insightsService = module.get(InsightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of insights with query options', async () => {
      const insights = [mockInsight];
      insightsService.findAll.mockResolvedValue(insights);

      const result = await resolver.findAll(mockUser, mockQueryOptionInput);

      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, mockQueryOptionInput);
      expect(result).toEqual(insights);
    });

    it('should return array of insights without query options', async () => {
      const insights = [mockInsight];
      insightsService.findAll.mockResolvedValue(insights);

      const result = await resolver.findAll(mockUser, undefined);

      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(insights);
    });

    it('should return empty array when no insights found', async () => {
      insightsService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll(mockUser, mockQueryOptionInput);

      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, mockQueryOptionInput);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      insightsService.findAll.mockRejectedValue(error);

      await expect(resolver.findAll(mockUser, mockQueryOptionInput)).rejects.toThrow(error);
      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, mockQueryOptionInput);
    });
  });

  describe('findOne', () => {
    it('should return insight by id', async () => {
      const insightId = 'insight-1';
      insightsService.findOne.mockResolvedValue(mockInsight);

      const result = await resolver.findOne(mockUser, insightId);

      expect(insightsService.findOne).toHaveBeenCalledWith(insightId, mockUser.id);
      expect(result).toEqual(mockInsight);
    });

    it('should handle NotFoundException', async () => {
      const insightId = 'insight-1';
      const error = new NotFoundException(INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(insightId));
      insightsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(mockUser, insightId)).rejects.toThrow(error);
      expect(insightsService.findOne).toHaveBeenCalledWith(insightId, mockUser.id);
    });

    it('should handle service errors', async () => {
      const insightId = 'insight-1';
      const error = new Error('Service error');
      insightsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(mockUser, insightId)).rejects.toThrow(error);
      expect(insightsService.findOne).toHaveBeenCalledWith(insightId, mockUser.id);
    });
  });

  describe('findByPeriod', () => {
    it('should return insight by period', async () => {
      insightsService.findByPeriod.mockResolvedValue(mockInsight);

      const result = await resolver.findByPeriod(mockUser, mockQueryInsightPeriodInput);

      expect(insightsService.findByPeriod).toHaveBeenCalledWith(mockQueryInsightPeriodInput, mockUser.id);
      expect(result).toEqual(mockInsight);
    });

    it('should handle NotFoundException', async () => {
      const error = new NotFoundException(
        INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(mockQueryInsightPeriodInput.period),
      );
      insightsService.findByPeriod.mockRejectedValue(error);

      await expect(resolver.findByPeriod(mockUser, mockQueryInsightPeriodInput)).rejects.toThrow(error);
      expect(insightsService.findByPeriod).toHaveBeenCalledWith(mockQueryInsightPeriodInput, mockUser.id);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      insightsService.findByPeriod.mockRejectedValue(error);

      await expect(resolver.findByPeriod(mockUser, mockQueryInsightPeriodInput)).rejects.toThrow(error);
      expect(insightsService.findByPeriod).toHaveBeenCalledWith(mockQueryInsightPeriodInput, mockUser.id);
    });
  });

  describe('Service methods existence', () => {
    it('should have all service methods defined', () => {
      expect(resolver.findAll).toBeDefined();
      expect(resolver.findOne).toBeDefined();
      expect(resolver.findByPeriod).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should handle findAll with complete query options', async () => {
      const completeInput: QueryOptionInput = {
        page: 2,
        take: 5,
      };
      const insights = [mockInsight];
      insightsService.findAll.mockResolvedValue(insights);

      const result = await resolver.findAll(mockUser, completeInput);

      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, completeInput);
      expect(result).toEqual(insights);
    });

    it('should handle findByPeriod with valid period format', async () => {
      const validPeriodInput: QueryInsightPeriodInput = {
        period: '2024-12',
      };
      insightsService.findByPeriod.mockResolvedValue(mockInsight);

      const result = await resolver.findByPeriod(mockUser, validPeriodInput);

      expect(insightsService.findByPeriod).toHaveBeenCalledWith(validPeriodInput, mockUser.id);
      expect(result).toEqual(mockInsight);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null query options in findAll', async () => {
      const insights = [mockInsight];
      insightsService.findAll.mockResolvedValue(insights);

      const result = await resolver.findAll(mockUser, undefined);

      expect(insightsService.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(insights);
    });

    it('should handle empty string id in findOne', async () => {
      const error = new Error('Invalid ID');
      insightsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(mockUser, '')).rejects.toThrow(error);
      expect(insightsService.findOne).toHaveBeenCalledWith('', mockUser.id);
    });

    it('should handle different user contexts', async () => {
      const otherUser: User = {
        id: 'user-2',
        email: 'other@example.com',
        role: 'USER' as any,
        password: 'hashedPassword123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const insights = [mockInsight];
      insightsService.findAll.mockResolvedValue(insights);

      const result = await resolver.findAll(otherUser, mockQueryOptionInput);

      expect(insightsService.findAll).toHaveBeenCalledWith(otherUser.id, mockQueryOptionInput);
      expect(result).toEqual(insights);
    });
  });
});
