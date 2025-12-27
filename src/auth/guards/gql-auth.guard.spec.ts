import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';

jest.mock('@nestjs/graphql');

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let mockContext: ExecutionContext;
  let mockGqlContext: any;

  const mockRequest = {
    headers: {
      authorization: 'Bearer token',
    },
    user: {
      id: 'test-user-id',
      role: 'USER',
    },
  };

  beforeEach(async () => {
    mockGqlContext = {
      getContext: jest.fn().mockReturnValue({ req: mockRequest }),
    };

    (GqlExecutionContext.create as jest.Mock) = jest.fn().mockReturnValue(mockGqlContext);

    mockContext = {
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [GqlAuthGuard],
    }).compile();

    guard = module.get<GqlAuthGuard>(GqlAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getRequest', () => {
    it('should extract request from GraphQL context', () => {
      const result = guard.getRequest(mockContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockContext);
      expect(mockGqlContext.getContext).toHaveBeenCalled();
      expect(result).toBe(mockRequest);
    });

    it('should return request with user from context', () => {
      const result = guard.getRequest(mockContext);

      expect(result.user).toEqual(mockRequest.user);
    });

    it('should return request with headers from context', () => {
      const result = guard.getRequest(mockContext);

      expect(result.headers).toEqual(mockRequest.headers);
    });

    it('should handle different request objects', () => {
      const differentRequest = {
        headers: {
          authorization: 'Bearer different-token',
        },
        user: {
          id: 'different-user-id',
          role: 'ADMIN',
        },
      };

      mockGqlContext.getContext.mockReturnValueOnce({ req: differentRequest });

      const result = guard.getRequest(mockContext);

      expect(result).toBe(differentRequest);
      expect(result.user).toEqual(differentRequest.user);
    });
  });
});

