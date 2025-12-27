import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'generated/prisma';

import { UsersService } from '../../users/services/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let usersService: jest.Mocked<UsersService>;

  const mockJwtSecret = 'test-jwt-secret';

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return mockJwtSecret;
        return undefined;
      }),
    };

    const mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get(ConfigService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user id and role when user exists', async () => {
      const payload = { sub: 'test-user-id' };

      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: payload.sub,
        role: mockUser.role,
      });
    });

    it('should return user id and role for admin user', async () => {
      const payload = { sub: 'admin-user-id' };
      const adminUser = {
        ...mockUser,
        id: 'admin-user-id',
        role: UserRole.ADMIN,
      };

      usersService.findOne.mockResolvedValue(adminUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: payload.sub,
        role: UserRole.ADMIN,
      });
    });

    it('should handle different user IDs correctly', async () => {
      const payload1 = { sub: 'user-1' };
      const payload2 = { sub: 'user-2' };
      const user1 = { ...mockUser, id: 'user-1' };
      const user2 = { ...mockUser, id: 'user-2', role: UserRole.ADMIN };

      usersService.findOne
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const result1 = await strategy.validate(payload1);
      const result2 = await strategy.validate(payload2);

      expect(usersService.findOne).toHaveBeenCalledTimes(2);
      expect(result1).toEqual({ id: 'user-1', role: UserRole.USER });
      expect(result2).toEqual({ id: 'user-2', role: UserRole.ADMIN });
    });
  });
});

