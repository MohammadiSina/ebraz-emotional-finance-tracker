import * as fs from 'node:fs';
import { join } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import OpenAI from 'openai';

import { AnalyticsService } from '../../analytics/services/analytics.service';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { PrismaService } from '../../common/services/prisma.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { UsersService } from '../../users/services/users.service';
import { INSIGHTS_CONSTANT } from '../constants/insights.constant';
import { QueryInsightPeriodInput } from '../dto/query-insight-period.input';

@Injectable()
export class InsightsService {
  private readonly openai: OpenAI;
  private readonly openaiModel: string;
  private readonly systemPrompt: string;

  constructor(
    @InjectQueue(INSIGHTS_CONSTANT.QUEUE_NAME) private readonly insightsQueue: Queue,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly analyticsService: AnalyticsService,
  ) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL')!;
    this.systemPrompt = fs.readFileSync(join(__dirname, '..', 'prompts', 'generate-insight.prompt.md'), 'utf8');
  }

  // TODO: Add logging
  async generate(userId: string): Promise<void> {
    // Step 1: Fetching user transactions for a given period
    const transactions = await this.transactionsService.findTopExpenseTransactions(userId);
    const { netBalance, period } = await this.analyticsService.getNetBalance(userId);

    // Step 2: Formatting data into a prompt for the LLM
    const res = await this.openai.responses.create({
      model: this.openaiModel,
      instructions: this.systemPrompt,
      input: `period: ${period}, netBalance: ${netBalance}, transactions: ${JSON.stringify(transactions)}`,
    });

    // TODO: Add logging
    if (res.error || res.incomplete_details) console.error('GENERATE: OpenAI Error', res.error);

    // Step 3: Saving the generated insight in the database
    await this.prisma.insight.create({
      data: { userId, period, llmModel: res.model, content: res.output_text, llmRequestId: res.id },
    });
  }

  async generateMany(): Promise<void> {
    const users = await this.usersService.findUsersEligibleForInsights(
      INSIGHTS_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS.MIN,
    );

    // TODO: Add logging
    // Add the insights generation to the insights queue
    for (const user of users)
      await this.insightsQueue.add(
        'generate',
        { userId: user.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: false },
      );
  }

  async findAll(userId: string, queryInsightInput?: QueryOptionInput) {
    const page = queryInsightInput?.page || 1;
    const take = queryInsightInput?.take || 3;
    const skip = (page - 1) * take;

    return this.prisma.insight.findMany({
      where: { userId },
      skip,
      take,
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, userId: true, period: true, content: true, createdAt: true },
    });
  }

  async findOne(id: string, userId: string) {
    const insight = await this.prisma.insight.findUnique({
      where: { id, userId },
      select: { id: true, userId: true, period: true, content: true, createdAt: true },
    });

    if (!insight) throw new NotFoundException(INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(id));

    return insight;
  }

  async findByPeriod(queryInsightPeriodInput: QueryInsightPeriodInput, userId: string) {
    const { period } = queryInsightPeriodInput;

    const insight = await this.prisma.insight.findUnique({
      where: { userId_period: { userId, period } },
      select: { id: true, userId: true, period: true, content: true, createdAt: true },
    });

    if (!insight) throw new NotFoundException(INSIGHTS_CONSTANT.ERROR.INSIGHT_NOT_FOUND(period));

    return insight;
  }
}
