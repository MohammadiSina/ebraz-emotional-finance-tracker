import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from '../services/auth.service';
import { RegisterInput } from '../dto/register.input';
import { LoginInput } from '../dto/login.input';
import { UserRole } from 'generated/prisma';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: jest.Mocked<AuthService>;

  const mockAuthPayload = {
    accessToken: 'jwt-access-token',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
    },
  };

  const mockRegisterInput: RegisterInput = {
    email: 'newuser@example.com',
    password: 'StrongPassword123!',
  };

  const mockLoginInput: LoginInput = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with registerInput', async () => {
      authService.register.mockResolvedValue(mockAuthPayload);

      const result = await resolver.register(mockRegisterInput);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterInput);
      expect(result).toEqual(mockAuthPayload);
    });

    it('should return AuthPayload with accessToken and user', async () => {
      authService.register.mockResolvedValue(mockAuthPayload);

      const result = await resolver.register(mockRegisterInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe(mockAuthPayload.accessToken);
      expect(result.user).toEqual(mockAuthPayload.user);
    });
  });

  describe('login', () => {
    it('should call authService.login with loginInput', async () => {
      authService.login.mockResolvedValue(mockAuthPayload);

      const result = await resolver.login(mockLoginInput);

      expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
      expect(result).toEqual(mockAuthPayload);
    });

    it('should return AuthPayload with accessToken and user', async () => {
      authService.login.mockResolvedValue(mockAuthPayload);

      const result = await resolver.login(mockLoginInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe(mockAuthPayload.accessToken);
      expect(result.user).toEqual(mockAuthPayload.user);
    });
  });
});
