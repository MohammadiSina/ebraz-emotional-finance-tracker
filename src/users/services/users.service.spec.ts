import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'generated/prisma';

import { HashService } from '../../auth/services/hash.service';
import { PrismaService } from '../../common/services/prisma.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { USER_CONSTANT } from '../constants/users.constant';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserCredentialInput } from '../dto/update-user-credential.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;
  let hashService: jest.Mocked<HashService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockUser: User = {
    id: 'test-user-id',
    role: UserRole.USER,
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAdminUser: User = {
    id: 'admin-user-id',
    role: UserRole.ADMIN,
    email: 'admin@example.com',
    password: 'hashed-admin-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCreateUserInput: CreateUserInput = {
    email: 'newuser@example.com',
    role: UserRole.USER,
    password: 'StrongPassword123!',
  };

  const mockUpdateUserInput: UpdateUserInput = {
    id: 'test-user-id',
    email: 'updated@example.com',
  };

  const mockUpdateUserCredentialInput: UpdateUserCredentialInput = {
    id: 'test-user-id',
    password: 'NewStrongPassword123!',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockHashService = {
      hashPassword: jest.fn(),
    };

    const mockTransactionsService = {
      findUsersWithMinimumTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    hashService = module.get(HashService);
    transactionsService = module.get(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const hashedPassword = 'hashed-password';
      const createdUser = { ...mockUser, password: hashedPassword };

      hashService.hashPassword.mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(mockCreateUserInput);

      expect(hashService.hashPassword).toHaveBeenCalledWith(mockCreateUserInput.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateUserInput,
          password: hashedPassword,
        },
        omit: { password: true, updatedAt: true },
      });
      expect(result).toEqual(createdUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      hashService.hashPassword.mockResolvedValue('hashed-password');
      (prismaService.user.create as jest.Mock).mockRejectedValue(error);

      await expect(service.create(mockCreateUserInput)).rejects.toThrow(error);
    });

    it('should create admin user', async () => {
      const adminInput: CreateUserInput = {
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        password: 'AdminPassword123!',
      };

      const hashedPassword = 'hashed-admin-password';
      const createdAdmin = { ...mockAdminUser, password: hashedPassword };

      hashService.hashPassword.mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdAdmin);

      const result = await service.create(adminInput);

      expect(hashService.hashPassword).toHaveBeenCalledWith(adminInput.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...adminInput,
          password: hashedPassword,
        },
        omit: { password: true, updatedAt: true },
      });
      expect(result).toEqual(createdAdmin);
    });
  });

  describe('findAll', () => {
    it('should return all users with default pagination', async () => {
      const users = [mockUser, mockAdminUser];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        take: 3,
        skip: 0,
        omit: { password: true, updatedAt: true },
      });
      expect(result).toEqual(users);
    });

    it('should return users with custom pagination', async () => {
      const users = [mockUser];
      const queryInput = { page: 2, take: 5 };

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll(queryInput);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        take: 5,
        skip: 5, // (page - 1) * take = (2 - 1) * 5 = 5
        omit: { password: true, updatedAt: true },
      });
      expect(result).toEqual(users);
    });

    it('should return empty array when no users found', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (prismaService.user.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const userId = 'test-user-id';

    it('should return a user by id', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND(userId)),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.findOne(userId)).rejects.toThrow(error);
    });
  });

  describe('findByEmail', () => {
    const email = 'test@example.com';

    it('should return user by email with selected fields', async () => {
      const userWithPassword = {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date('2024-01-01'),
        role: UserRole.USER,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithPassword);

      const result = await service.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true, email: true, password: true, createdAt: true, role: true },
      });
      expect(result).toEqual(userWithPassword);
    });

    it('should return null when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.findByEmail(email)).rejects.toThrow(error);
    });
  });

  describe('findUsersEligibleForInsights', () => {
    it('should return users eligible for insights', async () => {
      const minInsightTransactions = 5;
      const period = '2025-09';
      const groupedUsers = [
        { userId: 'user-1', _count: { userId: 10 } },
        { userId: 'user-2', _count: { userId: 8 } },
      ];
      const eligibleUsers = [{ id: 'user-1' }, { id: 'user-2' }];

      transactionsService.findUsersWithMinimumTransactions.mockResolvedValue(groupedUsers);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(eligibleUsers);

      const result = await service.findUsersEligibleForInsights(minInsightTransactions, period);

      expect(transactionsService.findUsersWithMinimumTransactions).toHaveBeenCalledWith(minInsightTransactions, period);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: { id: true },
      });
      expect(result).toEqual(eligibleUsers);
    });

    it('should work without period parameter', async () => {
      const minInsightTransactions = 3;
      const groupedUsers = [{ userId: 'user-1', _count: { userId: 5 } }];
      const eligibleUsers = [{ id: 'user-1' }];

      transactionsService.findUsersWithMinimumTransactions.mockResolvedValue(groupedUsers);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(eligibleUsers);

      const result = await service.findUsersEligibleForInsights(minInsightTransactions);

      expect(transactionsService.findUsersWithMinimumTransactions).toHaveBeenCalledWith(
        minInsightTransactions,
        undefined,
      );
      expect(result).toEqual(eligibleUsers);
    });

    it('should return empty array when no eligible users', async () => {
      const minInsightTransactions = 10;
      transactionsService.findUsersWithMinimumTransactions.mockResolvedValue([]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findUsersEligibleForInsights(minInsightTransactions);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true },
      });
      expect(result).toEqual([]);
    });
  });

  describe('userExists', () => {
    const email = 'test@example.com';

    it('should return true when user exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id' });

      const result = await service.userExists(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.userExists(email);

      expect(result).toBe(false);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.userExists(email)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const userId = 'test-user-id';

    it('should allow user to update their own profile', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserInput };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, mockUpdateUserInput, mockUser);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: mockUpdateUserInput,
        omit: { password: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should allow admin to update any user', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserInput };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, mockUpdateUserInput, mockAdminUser);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: mockUpdateUserInput,
        omit: { password: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should allow admin to update user role', async () => {
      const updateWithRole: UpdateUserInput = {
        id: userId,
        role: UserRole.ADMIN,
      };
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateWithRole, mockAdminUser);

      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when non-admin tries to update another user', async () => {
      const otherUser = { ...mockUser, id: 'other-user-id' };

      await expect(service.update(userId, mockUpdateUserInput, otherUser)).rejects.toThrow(
        new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_DENIED),
      );
    });

    it('should throw ForbiddenException when non-admin tries to update role', async () => {
      const updateWithRole: UpdateUserInput = {
        id: userId,
        role: UserRole.ADMIN,
      };

      await expect(service.update(userId, updateWithRole, mockUser)).rejects.toThrow(
        new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_ROLE_DENIED),
      );
    });

    it('should throw NotFoundException when admin tries to update non-existent user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(userId, mockUpdateUserInput, mockAdminUser)).rejects.toThrow(
        new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND(userId)),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      const updateInputWithoutRole: UpdateUserInput = {
        id: userId,
        email: 'updated@example.com',
      };
      (prismaService.user.update as jest.Mock).mockRejectedValue(error);

      await expect(service.update(userId, updateInputWithoutRole, mockUser)).rejects.toThrow(error);
    });
  });

  describe('updateCredential', () => {
    const userId = 'test-user-id';

    it('should allow user to update their own credentials', async () => {
      const hashedPassword = 'new-hashed-password';
      const updatedUser = { ...mockUser, password: hashedPassword };

      hashService.hashPassword.mockResolvedValue(hashedPassword);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateCredential(userId, mockUpdateUserCredentialInput, mockUser);

      expect(hashService.hashPassword).toHaveBeenCalledWith(mockUpdateUserCredentialInput.password);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          ...mockUpdateUserCredentialInput,
          password: hashedPassword,
        },
        omit: { password: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should allow admin to update any user credentials', async () => {
      const hashedPassword = 'new-hashed-password';
      const updatedUser = { ...mockUser, password: hashedPassword };

      hashService.hashPassword.mockResolvedValue(hashedPassword);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateCredential(userId, mockUpdateUserCredentialInput, mockAdminUser);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when non-admin tries to update another user credentials', async () => {
      const otherUser = { ...mockUser, id: 'other-user-id' };

      await expect(service.updateCredential(userId, mockUpdateUserCredentialInput, otherUser)).rejects.toThrow(
        new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_DENIED),
      );
    });

    it('should throw NotFoundException when admin tries to update non-existent user credentials', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateCredential(userId, mockUpdateUserCredentialInput, mockAdminUser)).rejects.toThrow(
        new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND(userId)),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      hashService.hashPassword.mockResolvedValue('hashed-password');
      (prismaService.user.update as jest.Mock).mockRejectedValue(error);

      await expect(service.updateCredential(userId, mockUpdateUserCredentialInput, mockUser)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    const userId = 'test-user-id';

    it('should allow user to delete their own account', async () => {
      const deletedUser = { ...mockUser };
      (prismaService.user.delete as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.remove(userId, mockUser);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(result).toEqual(deletedUser);
    });

    it('should allow admin to delete any user', async () => {
      const deletedUser = { ...mockUser };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.remove(userId, mockAdminUser);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        omit: { password: true },
      });
      expect(result).toEqual(deletedUser);
    });

    it('should throw ForbiddenException when non-admin tries to delete another user', async () => {
      const otherUser = { ...mockUser, id: 'other-user-id' };

      await expect(service.remove(userId, otherUser)).rejects.toThrow(
        new ForbiddenException(USER_CONSTANT.ERROR.REMOVE_DENIED),
      );
    });

    it('should throw NotFoundException when admin tries to delete non-existent user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(userId, mockAdminUser)).rejects.toThrow(
        new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND(userId)),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (prismaService.user.delete as jest.Mock).mockRejectedValue(error);

      await expect(service.remove(userId, mockUser)).rejects.toThrow(error);
    });
  });

  describe('Authorization edge cases', () => {
    it('should handle admin updating their own account', async () => {
      const updatedAdmin = { ...mockAdminUser, email: 'updated-admin@example.com' };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedAdmin);

      const result = await service.update(mockAdminUser.id, mockUpdateUserInput, mockAdminUser);

      expect(result).toEqual(updatedAdmin);
    });

    it('should handle admin updating their own credentials', async () => {
      const hashedPassword = 'new-admin-password';
      const updatedAdmin = { ...mockAdminUser, password: hashedPassword };

      hashService.hashPassword.mockResolvedValue(hashedPassword);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedAdmin);

      const result = await service.updateCredential(mockAdminUser.id, mockUpdateUserCredentialInput, mockAdminUser);

      expect(result).toEqual(updatedAdmin);
    });

    it('should handle admin deleting their own account', async () => {
      const deletedAdmin = { ...mockAdminUser };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(deletedAdmin);

      const result = await service.remove(mockAdminUser.id, mockAdminUser);

      expect(result).toEqual(deletedAdmin);
    });
  });
});
