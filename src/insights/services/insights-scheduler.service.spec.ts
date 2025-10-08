import { Test, TestingModule } from '@nestjs/testing';
import { CronExpression } from '@nestjs/schedule';

import { InsightsSchedulerService } from './insights-scheduler.service';
import { InsightsService } from './insights.service';

describe('InsightsSchedulerService', () => {
  let service: InsightsSchedulerService;
  let insightsService: jest.Mocked<InsightsService>;

  beforeEach(async () => {
    const mockInsightsService = {
      generateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsSchedulerService,
        {
          provide: InsightsService,
          useValue: mockInsightsService,
        },
      ],
    }).compile();

    service = module.get<InsightsSchedulerService>(InsightsSchedulerService);
    insightsService = module.get(InsightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleInsightGenerationCron', () => {
    it('should call generateMany on insights service', async () => {
      insightsService.generateMany.mockResolvedValue();

      await service.handleInsightGenerationCron();

      expect(insightsService.generateMany).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      insightsService.generateMany.mockRejectedValue(error);

      await expect(service.handleInsightGenerationCron()).rejects.toThrow(error);
    });

    it('should handle multiple calls', async () => {
      insightsService.generateMany.mockResolvedValue();

      await service.handleInsightGenerationCron();
      await service.handleInsightGenerationCron();
      await service.handleInsightGenerationCron();

      expect(insightsService.generateMany).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cron Decorator', () => {
    it('should have proper cron decorator', () => {
      const schedulerType = Reflect.getMetadata('SCHEDULER_TYPE', service.handleInsightGenerationCron);
      const cronMetadata = Reflect.getMetadata('SCHEDULE_CRON_OPTIONS', service.handleInsightGenerationCron);

      // according to the schedule module source code, 1 is the CRON scheduler type
      // https://github.com/nestjs/schedule/blob/master/lib/enums/scheduler-type.enum.ts
      expect(schedulerType).toBe(1);
      expect(cronMetadata.cronTime).toBe(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT);
    });
  });
});
