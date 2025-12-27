import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from 'generated/prisma';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

jest.mock('@nestjs/graphql');

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockContext: ExecutionContext;
  let mockGqlContext: any;

  let mockRequest: {
    user: {
      id: string;
      role: UserRole;
    };
  };

  beforeEach(async () => {
    mockRequest = {
      user: {
        id: 'test-user-id',
        role: UserRole.USER,
      },
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockGqlContext = {
      getContext: jest.fn().mockReturnValue({ req: mockRequest }),
    };

    (GqlExecutionContext.create as jest.Mock) = jest.fn().mockReturnValue(mockGqlContext);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.USER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user.role = UserRole.USER;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return true when admin user accesses admin-only route', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user.role = UserRole.ADMIN;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when user accesses admin-only route', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user.role = UserRole.USER;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle empty roles array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});

