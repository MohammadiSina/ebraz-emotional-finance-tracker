import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { HashService } from './hash.service';

jest.mock('bcrypt');

describe('HashService', () => {
  let service: HashService;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt using salt rounds 12', async () => {
      const plainPassword = 'StrongPassword123!';
      const hashedPassword = '$2b$12$hashedpasswordstring';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(plainPassword);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle different passwords correctly', async () => {
      const password1 = 'Password1!';
      const password2 = 'AnotherPassword2@';
      const hash1 = '$2b$12$hash1';
      const hash2 = '$2b$12$hash2';

      mockedBcrypt.hash.mockResolvedValueOnce(hash1 as never).mockResolvedValueOnce(hash2 as never);

      const result1 = await service.hashPassword(password1);
      const result2 = await service.hashPassword(password2);

      expect(mockedBcrypt.hash).toHaveBeenCalledTimes(2);
      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true when passwords match', async () => {
      const plainPassword = 'StrongPassword123!';
      const hashedPassword = '$2b$12$hashedpasswordstring';

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.comparePasswords(plainPassword, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      const plainPassword = 'WrongPassword123!';
      const hashedPassword = '$2b$12$hashedpasswordstring';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePasswords(plainPassword, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle multiple comparisons correctly', async () => {
      const plainPassword1 = 'Password1!';
      const plainPassword2 = 'Password2!';
      const hashedPassword = '$2b$12$hashedpasswordstring';

      mockedBcrypt.compare
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);

      const result1 = await service.comparePasswords(plainPassword1, hashedPassword);
      const result2 = await service.comparePasswords(plainPassword2, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});

