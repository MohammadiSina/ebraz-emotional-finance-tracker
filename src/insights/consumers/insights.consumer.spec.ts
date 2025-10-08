import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { InsightsConsumer } from './insights.consumer';
import { InsightsService } from '../services/insights.service';

describe('InsightsConsumer', () => {
  let consumer: InsightsConsumer;
  let insightsService: jest.Mocked<InsightsService>;

  beforeEach(async () => {
    const mockInsightsService = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsConsumer,
        {
          provide: InsightsService,
          useValue: mockInsightsService,
        },
      ],
    }).compile();

    consumer = module.get<InsightsConsumer>(InsightsConsumer);
    insightsService = module.get(InsightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('process', () => {
    it('should process generate job successfully', async () => {
      const mockJob: Job<{ userId: string }> = {
        name: 'generate',
        data: { userId: 'user-1' },
      } as Job<{ userId: string }>;

      insightsService.generate.mockResolvedValue();

      await consumer.process(mockJob);

      expect(insightsService.generate).toHaveBeenCalledWith('user-1');
    });

    it('should handle service errors', async () => {
      const mockJob: Job<{ userId: string }> = {
        name: 'generate',
        data: { userId: 'user-1' },
      } as Job<{ userId: string }>;

      const error = new Error('Service error');
      insightsService.generate.mockRejectedValue(error);

      await expect(consumer.process(mockJob)).rejects.toThrow(error);
    });

    it('should ignore jobs with different names', async () => {
      const mockJob: Job<{ userId: string }> = {
        name: 'other-job',
        data: { userId: 'user-1' },
      } as Job<{ userId: string }>;

      await consumer.process(mockJob);

      expect(insightsService.generate).not.toHaveBeenCalled();
    });

    it('should ignore jobs with missing userId', async () => {
      const mockJob: Job<{ userId: string }> = {
        name: 'generate',
        data: { userId: '' },
      } as Job<{ userId: string }>;

      await consumer.process(mockJob);

      expect(insightsService.generate).not.toHaveBeenCalled();
    });
  });

  describe('Job Processing Edge Cases', () => {
    it('should ignore job without name', async () => {
      const mockJob: Job<{ userId: string }> = {
        name: undefined as any,
        data: { userId: 'user-1' },
      } as Job<{ userId: string }>;

      await consumer.process(mockJob);

      expect(insightsService.generate).not.toHaveBeenCalled();
    });
  });
});
