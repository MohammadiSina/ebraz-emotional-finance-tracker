import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'generated/prisma';

import { UsersService } from '../../users/services/users.service';
import { USER_CONSTANT } from '../../users/constants/users.constant';
import { AUTH_CONSTANT } from '../constants/auth.constant';
import { RegisterInput } from '../dto/register.input';
import { LoginInput } from '../dto/login.input';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  let hashService: jest.Mocked<HashService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01'),
  };

  const mockUserWithPassword = {
    ...mockUser,
    password: 'hashed-password',
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
    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockUsersService = {
      userExists: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockHashService = {
      hashPassword: jest.fn(),
      comparePasswords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    hashService = module.get(HashService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashed-password-123';
      const accessToken = 'jwt-access-token';

      usersService.userExists.mockResolvedValue(false);
      hashService.hashPassword.mockResolvedValue(hashedPassword);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.register(mockRegisterInput);

      expect(usersService.userExists).toHaveBeenCalledWith(mockRegisterInput.email);
      expect(hashService.hashPassword).toHaveBeenCalledWith(mockRegisterInput.password);
      expect(usersService.create).toHaveBeenCalledWith({
        ...mockRegisterInput,
        password: hashedPassword,
        role: UserRole.USER,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: mockUser.id });
      expect(result).toEqual({
        accessToken,
        user: mockUser,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.userExists.mockResolvedValue(true);

      await expect(service.register(mockRegisterInput)).rejects.toThrow(
        new ConflictException(USER_CONSTANT.ERROR.DUPLICATE_EMAIL),
      );

      expect(usersService.userExists).toHaveBeenCalledWith(mockRegisterInput.email);
      expect(hashService.hashPassword).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const accessToken = 'jwt-access-token';

      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      hashService.comparePasswords.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.login(mockLoginInput);

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUserWithPassword.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: mockUserWithPassword.id });
      expect(result).toEqual({
        accessToken,
        user: {
          id: mockUserWithPassword.id,
          email: mockUserWithPassword.email,
          role: mockUserWithPassword.role,
          createdAt: mockUserWithPassword.createdAt,
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(mockLoginInput)).rejects.toThrow(
        new UnauthorizedException(AUTH_CONSTANT.ERROR.UNAUTHORIZED_CREDENTIALS),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      hashService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(mockLoginInput)).rejects.toThrow(
        new UnauthorizedException(AUTH_CONSTANT.ERROR.UNAUTHORIZED_CREDENTIALS),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUserWithPassword.password,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      hashService.comparePasswords.mockResolvedValue(true);

      const result = await service.validateUser(mockLoginInput.email, mockLoginInput.password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUserWithPassword.password,
      );
      expect(result).toEqual(mockUserWithPassword);
    });

    it('should return null when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(mockLoginInput.email, mockLoginInput.password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      hashService.comparePasswords.mockResolvedValue(false);

      const result = await service.validateUser(mockLoginInput.email, mockLoginInput.password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockLoginInput.email);
      expect(hashService.comparePasswords).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUserWithPassword.password,
      );
      expect(result).toBeNull();
    });
  });
});
