import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from 'generated/prisma';

import { CreateTransactionInput } from '../dto/create-transaction.input';
import { QueryTransactionInput } from '../dto/query-transaction.input';
import { UpdateTransactionInput } from '../dto/update-transaction.input';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionIntent,
  TransactionEmotion,
  TransactionCurrency,
} from 'generated/prisma';
import { User } from '../../users/entities/user.entity';
import { TransactionsService } from '../services/transactions.service';
import { TransactionsResolver } from './transactions.resolver';

describe('TransactionsResolver', () => {
  let resolver: TransactionsResolver;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockUser: User = {
    id: 'test-user-id',
    role: UserRole.USER,
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

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

  const mockUpdateTransactionInput: UpdateTransactionInput = {
    id: 'test-transaction-id',
    note: 'Updated transaction',
  };

  beforeEach(async () => {
    const mockTransactionsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsResolver,
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    resolver = module.get<TransactionsResolver>(TransactionsResolver);
    transactionsService = module.get(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      transactionsService.create.mockResolvedValue(mockTransaction);

      const result = await resolver.createTransaction(mockCreateTransactionInput, mockUser);

      expect(transactionsService.create).toHaveBeenCalledWith(mockCreateTransactionInput, mockUser.id);
      expect(result).toEqual(mockTransaction);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      transactionsService.create.mockRejectedValue(error);

      await expect(resolver.createTransaction(mockCreateTransactionInput, mockUser)).rejects.toThrow(error);
    });

    it('should pass through all input parameters correctly', async () => {
      const complexInput: CreateTransactionInput = {
        type: TransactionType.INCOME,
        amount: 200000,
        exchangeRate: 50000,
        category: TransactionCategory.ENTERTAINMENT,
        intent: TransactionIntent.IMPULSIVE,
        emotion: TransactionEmotion.REGRET,
        note: 'Complex transaction',
        occurredAt: new Date('2024-02-01'),
      };

      transactionsService.create.mockResolvedValue(mockTransaction);

      await resolver.createTransaction(complexInput, mockUser);

      expect(transactionsService.create).toHaveBeenCalledWith(complexInput, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all transactions without query parameters', async () => {
      const transactions = [mockTransaction];
      transactionsService.findAll.mockResolvedValue(transactions);

      const result = await resolver.findAll(mockUser);

      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(transactions);
    });

    it('should return filtered transactions with query parameters', async () => {
      const queryInput: QueryTransactionInput = {
        page: 2,
        take: 10,
        category: TransactionCategory.DAILY_EXPENSES,
        intent: TransactionIntent.PLANNED,
        emotion: TransactionEmotion.SATISFACTION,
        occurredAt: new Date('2024-01-01'),
        minAmount: 1000,
        maxAmount: 100000,
        minAmountInUsd: 0.1,
        maxAmountInUsd: 2.5,
      };

      const transactions = [mockTransaction];
      transactionsService.findAll.mockResolvedValue(transactions);

      const result = await resolver.findAll(mockUser, queryInput);

      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id, queryInput);
      expect(result).toEqual(transactions);
    });

    it('should return empty array when no transactions found', async () => {
      transactionsService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll(mockUser);

      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      transactionsService.findAll.mockRejectedValue(error);

      await expect(resolver.findAll(mockUser)).rejects.toThrow(error);
    });

    it('should pass through all query parameters correctly', async () => {
      const complexQuery: QueryTransactionInput = {
        page: 3,
        take: 5,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.TRANSPORTATION,
        intent: TransactionIntent.MANDATORY,
        emotion: TransactionEmotion.NEUTRAL,
        occurredAt: new Date('2024-03-01'),
        minAmount: 5000,
        maxAmount: 50000,
        minAmountInUsd: 0.2,
        maxAmountInUsd: 1.5,
      };

      transactionsService.findAll.mockResolvedValue([]);

      await resolver.findAll(mockUser, complexQuery);

      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id, complexQuery);
    });
  });

  describe('findOne', () => {
    const transactionId = 'test-transaction-id';

    it('should return a transaction by id', async () => {
      transactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await resolver.findOne(transactionId, mockUser);

      expect(transactionsService.findOne).toHaveBeenCalledWith(transactionId, mockUser.id);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const error = new NotFoundException('Transaction not found');
      transactionsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(transactionId, mockUser)).rejects.toThrow(error);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      transactionsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(transactionId, mockUser)).rejects.toThrow(error);
    });

    it('should pass through the id parameter correctly', async () => {
      const differentId = 'different-transaction-id';
      transactionsService.findOne.mockResolvedValue(mockTransaction);

      await resolver.findOne(differentId, mockUser);

      expect(transactionsService.findOne).toHaveBeenCalledWith(differentId, mockUser.id);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction successfully', async () => {
      const updatedTransaction = { ...mockTransaction, ...mockUpdateTransactionInput };
      transactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await resolver.updateTransaction(mockUpdateTransactionInput, mockUser);

      expect(transactionsService.update).toHaveBeenCalledWith(
        mockUpdateTransactionInput.id,
        mockUser.id,
        mockUpdateTransactionInput,
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should handle NotFoundException when transaction not found', async () => {
      const error = new NotFoundException('Transaction not found');
      transactionsService.update.mockRejectedValue(error);

      await expect(resolver.updateTransaction(mockUpdateTransactionInput, mockUser)).rejects.toThrow(error);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      transactionsService.update.mockRejectedValue(error);

      await expect(resolver.updateTransaction(mockUpdateTransactionInput, mockUser)).rejects.toThrow(error);
    });

    it('should pass through all update parameters correctly', async () => {
      const complexUpdate: UpdateTransactionInput = {
        id: 'test-transaction-id',
        amount: 200000,
        exchangeRate: 50000,
        category: TransactionCategory.ENTERTAINMENT,
        intent: TransactionIntent.IMPULSIVE,
        emotion: TransactionEmotion.REGRET,
        note: 'Updated complex transaction',
        occurredAt: new Date('2024-02-01'),
      };

      const updatedTransaction = { ...mockTransaction, ...complexUpdate };
      transactionsService.update.mockResolvedValue(updatedTransaction);

      await resolver.updateTransaction(complexUpdate, mockUser);

      expect(transactionsService.update).toHaveBeenCalledWith(complexUpdate.id, mockUser.id, complexUpdate);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateTransactionInput = {
        id: 'test-transaction-id',
        note: 'Just updating the note',
      };

      const updatedTransaction = { ...mockTransaction, ...partialUpdate };
      transactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await resolver.updateTransaction(partialUpdate, mockUser);

      expect(transactionsService.update).toHaveBeenCalledWith(partialUpdate.id, mockUser.id, partialUpdate);
      expect(result).toEqual(updatedTransaction);
    });
  });

  describe('removeTransaction', () => {
    const transactionId = 'test-transaction-id';

    it('should remove a transaction successfully', async () => {
      transactionsService.remove.mockResolvedValue(mockTransaction);

      const result = await resolver.removeTransaction(transactionId, mockUser);

      expect(transactionsService.remove).toHaveBeenCalledWith(transactionId, mockUser.id);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const error = new NotFoundException('Transaction not found');
      transactionsService.remove.mockRejectedValue(error);

      await expect(resolver.removeTransaction(transactionId, mockUser)).rejects.toThrow(error);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      transactionsService.remove.mockRejectedValue(error);

      await expect(resolver.removeTransaction(transactionId, mockUser)).rejects.toThrow(error);
    });

    it('should pass through the id parameter correctly', async () => {
      const differentId = 'different-transaction-id';
      transactionsService.remove.mockResolvedValue(mockTransaction);

      await resolver.removeTransaction(differentId, mockUser);

      expect(transactionsService.remove).toHaveBeenCalledWith(differentId, mockUser.id);
    });
  });

  describe('User context handling', () => {
    it('should use different user IDs correctly', async () => {
      const user1: User = { ...mockUser, id: 'user-1' };
      const user2: User = { ...mockUser, id: 'user-2' };

      transactionsService.findAll.mockResolvedValue([]);

      await resolver.findAll(user1);
      expect(transactionsService.findAll).toHaveBeenLastCalledWith('user-1', undefined);

      await resolver.findAll(user2);
      expect(transactionsService.findAll).toHaveBeenLastCalledWith('user-2', undefined);
    });

    it('should handle user with different roles', async () => {
      const adminUser: User = { ...mockUser, role: UserRole.ADMIN };
      transactionsService.findAll.mockResolvedValue([]);

      await resolver.findAll(adminUser);

      expect(transactionsService.findAll).toHaveBeenCalledWith(adminUser.id, undefined);
    });
  });

  describe('Input validation', () => {
    it('should handle undefined query input gracefully', async () => {
      transactionsService.findAll.mockResolvedValue([]);

      await resolver.findAll(mockUser, undefined);
      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id, undefined);
    });

    it('should handle empty string id parameter', async () => {
      const error = new NotFoundException('Transaction not found');
      transactionsService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne('', mockUser)).rejects.toThrow(error);
      expect(transactionsService.findOne).toHaveBeenCalledWith('', mockUser.id);
    });
  });
});
