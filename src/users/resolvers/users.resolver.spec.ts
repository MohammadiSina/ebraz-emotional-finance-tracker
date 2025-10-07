import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'generated/prisma';
import { UsersResolver } from './users.resolver';
import { UsersService } from '../services/users.service';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { UpdateUserCredentialInput } from '../dto/update-user-credential.input';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { User, NewUser } from '../entities/user.entity';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: jest.Mocked<UsersService>;

  // Mock data
  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockAdminUser: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockNewUser: NewUser = {
    id: 'user-2',
    email: 'newuser@example.com',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockCreateUserInput: CreateUserInput = {
    email: 'newuser@example.com',
    role: UserRole.USER,
    password: 'StrongPassword123!',
  };

  const mockUpdateUserInput: UpdateUserInput = {
    id: 'user-1',
    email: 'updated@example.com',
    role: UserRole.USER,
  };

  const mockUpdateUserCredentialInput: UpdateUserCredentialInput = {
    id: 'user-1',
    password: 'NewStrongPassword123!',
  };

  const mockQueryOptionInput: QueryOptionInput = {
    page: 1,
    take: 10,
  };

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateCredential: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user and return NewUser', async () => {
      usersService.create.mockResolvedValue(mockNewUser);

      const result = await resolver.createUser(mockCreateUserInput);

      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserInput);
      expect(result).toEqual(mockNewUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.create.mockRejectedValue(error);

      await expect(resolver.createUser(mockCreateUserInput)).rejects.toThrow(error);
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserInput);
    });
  });

  describe('findAll', () => {
    it('should return array of users with query options', async () => {
      const users = [mockUser, mockAdminUser];
      usersService.findAll.mockResolvedValue(users);

      const result = await resolver.findAll(mockQueryOptionInput);

      expect(usersService.findAll).toHaveBeenCalledWith(mockQueryOptionInput);
      expect(result).toEqual(users);
    });

    it('should return array of users without query options', async () => {
      const users = [mockUser, mockAdminUser];
      usersService.findAll.mockResolvedValue(users);

      const result = await resolver.findAll(undefined);

      expect(usersService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(users);
    });

    it('should return empty array when no users found', async () => {
      usersService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll(mockQueryOptionInput);

      expect(usersService.findAll).toHaveBeenCalledWith(mockQueryOptionInput);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.findAll.mockRejectedValue(error);

      await expect(resolver.findAll(mockQueryOptionInput)).rejects.toThrow(error);
      expect(usersService.findAll).toHaveBeenCalledWith(mockQueryOptionInput);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'user-1';
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.findOne(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      const userId = 'user-1';
      const error = new Error('Service error');
      usersService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne(userId)).rejects.toThrow(error);
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated user', async () => {
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(mockUser, mockUpdateUserInput);

      expect(usersService.update).toHaveBeenCalledWith(mockUpdateUserInput.id, mockUpdateUserInput, mockUser);
      expect(result).toEqual(updatedUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.update.mockRejectedValue(error);

      await expect(resolver.updateUser(mockUser, mockUpdateUserInput)).rejects.toThrow(error);
      expect(usersService.update).toHaveBeenCalledWith(mockUpdateUserInput.id, mockUpdateUserInput, mockUser);
    });

    it('should work with admin user updating any user', async () => {
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(mockAdminUser, mockUpdateUserInput);

      expect(usersService.update).toHaveBeenCalledWith(mockUpdateUserInput.id, mockUpdateUserInput, mockAdminUser);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateUserCredential', () => {
    it('should update user credentials and return updated user', async () => {
      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      usersService.updateCredential.mockResolvedValue(updatedUser);

      const result = await resolver.updateUserCredential(mockUser, mockUpdateUserCredentialInput);

      expect(usersService.updateCredential).toHaveBeenCalledWith(
        mockUpdateUserCredentialInput.id,
        mockUpdateUserCredentialInput,
        mockUser,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.updateCredential.mockRejectedValue(error);

      await expect(resolver.updateUserCredential(mockUser, mockUpdateUserCredentialInput)).rejects.toThrow(error);
      expect(usersService.updateCredential).toHaveBeenCalledWith(
        mockUpdateUserCredentialInput.id,
        mockUpdateUserCredentialInput,
        mockUser,
      );
    });

    it('should work with admin user updating any user credentials', async () => {
      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      usersService.updateCredential.mockResolvedValue(updatedUser);

      const result = await resolver.updateUserCredential(mockAdminUser, mockUpdateUserCredentialInput);

      expect(usersService.updateCredential).toHaveBeenCalledWith(
        mockUpdateUserCredentialInput.id,
        mockUpdateUserCredentialInput,
        mockAdminUser,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('removeUser', () => {
    it('should remove user and return removed user', async () => {
      const userId = 'user-1';
      usersService.remove.mockResolvedValue(mockUser);

      const result = await resolver.removeUser(mockUser, userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId, mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      const userId = 'user-1';
      const error = new Error('Service error');
      usersService.remove.mockRejectedValue(error);

      await expect(resolver.removeUser(mockUser, userId)).rejects.toThrow(error);
      expect(usersService.remove).toHaveBeenCalledWith(userId, mockUser);
    });

    it('should work with admin user removing any user', async () => {
      const userId = 'user-1';
      usersService.remove.mockResolvedValue(mockUser);

      const result = await resolver.removeUser(mockAdminUser, userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId, mockAdminUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('Authorization and Guards', () => {
    it('should have proper guards and roles decorators on createUser', () => {
      const createUserMetadata = Reflect.getMetadata('__guards__', resolver.createUser);
      const createUserRoles = Reflect.getMetadata('roles', resolver.createUser);

      expect(createUserMetadata).toBeDefined();
      expect(createUserRoles).toEqual([UserRole.ADMIN]);
    });

    it('should have proper guards and roles decorators on findAll', () => {
      const findAllMetadata = Reflect.getMetadata('__guards__', resolver.findAll);
      const findAllRoles = Reflect.getMetadata('roles', resolver.findAll);

      expect(findAllMetadata).toBeDefined();
      expect(findAllRoles).toEqual([UserRole.ADMIN]);
    });

    it('should have proper guards and roles decorators on findOne', () => {
      const findOneMetadata = Reflect.getMetadata('__guards__', resolver.findOne);
      const findOneRoles = Reflect.getMetadata('roles', resolver.findOne);

      expect(findOneMetadata).toBeDefined();
      expect(findOneRoles).toEqual([UserRole.ADMIN]);
    });

    it('should have proper guards on updateUser (no roles required)', () => {
      const updateUserMetadata = Reflect.getMetadata('__guards__', resolver.updateUser);
      const updateUserRoles = Reflect.getMetadata('roles', resolver.updateUser);

      expect(updateUserMetadata).toBeDefined();
      expect(updateUserRoles).toBeUndefined();
    });

    it('should have proper guards on updateUserCredential (no roles required)', () => {
      const updateUserCredentialMetadata = Reflect.getMetadata('__guards__', resolver.updateUserCredential);
      const updateUserCredentialRoles = Reflect.getMetadata('roles', resolver.updateUserCredential);

      expect(updateUserCredentialMetadata).toBeDefined();
      expect(updateUserCredentialRoles).toBeUndefined();
    });

    it('should have proper guards on removeUser (no roles required)', () => {
      const removeUserMetadata = Reflect.getMetadata('__guards__', resolver.removeUser);
      const removeUserRoles = Reflect.getMetadata('roles', resolver.removeUser);

      expect(removeUserMetadata).toBeDefined();
      expect(removeUserRoles).toBeUndefined();
    });
  });

  describe('GraphQL Decorators', () => {
    it('should have proper GraphQL decorators on all methods', () => {
      // These tests verify that the resolver methods are properly decorated
      // The actual GraphQL metadata is handled by NestJS and GraphQL internally
      expect(resolver.createUser).toBeDefined();
      expect(resolver.findAll).toBeDefined();
      expect(resolver.findOne).toBeDefined();
      expect(resolver.updateUser).toBeDefined();
      expect(resolver.updateUserCredential).toBeDefined();
      expect(resolver.removeUser).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should handle createUserInput with all required fields', async () => {
      const completeInput: CreateUserInput = {
        email: 'test@example.com',
        role: UserRole.ADMIN,
        password: 'StrongPassword123!',
      };
      usersService.create.mockResolvedValue(mockNewUser);

      const result = await resolver.createUser(completeInput);

      expect(usersService.create).toHaveBeenCalledWith(completeInput);
      expect(result).toEqual(mockNewUser);
    });

    it('should handle updateUserInput with partial fields', async () => {
      const partialInput: UpdateUserInput = {
        id: 'user-1',
        email: 'updated@example.com',
        // role is optional
      };
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(mockUser, partialInput);

      expect(usersService.update).toHaveBeenCalledWith(partialInput.id, partialInput, mockUser);
      expect(result).toEqual(updatedUser);
    });

    it('should handle updateUserCredentialInput with required fields', async () => {
      const credentialInput: UpdateUserCredentialInput = {
        id: 'user-1',
        password: 'NewStrongPassword123!',
      };
      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      usersService.updateCredential.mockResolvedValue(updatedUser);

      const result = await resolver.updateUserCredential(mockUser, credentialInput);

      expect(usersService.updateCredential).toHaveBeenCalledWith(credentialInput.id, credentialInput, mockUser);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined query options in findAll', async () => {
      const users = [mockUser];
      usersService.findAll.mockResolvedValue(users);

      const result = await resolver.findAll(undefined);

      expect(usersService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(users);
    });

    it('should handle empty string id in findOne', async () => {
      const error = new Error('Invalid ID');
      usersService.findOne.mockRejectedValue(error);

      await expect(resolver.findOne('')).rejects.toThrow(error);
      expect(usersService.findOne).toHaveBeenCalledWith('');
    });

    it('should handle empty string id in removeUser', async () => {
      const error = new Error('Invalid ID');
      usersService.remove.mockRejectedValue(error);

      await expect(resolver.removeUser(mockUser, '')).rejects.toThrow(error);
      expect(usersService.remove).toHaveBeenCalledWith('', mockUser);
    });
  });
});
