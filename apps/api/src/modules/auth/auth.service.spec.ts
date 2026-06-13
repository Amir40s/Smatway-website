import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { hashToken } from '../../common/utils/token.util';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  authProvider: { findUnique: jest.fn(), create: jest.fn() },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};
const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-jwt'),
} as unknown as JwtService;
const mockMail = { sendPasswordReset: jest.fn() };
const mockStorage = { resolveImageUrl: jest.fn() };
const mockRes = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockPrisma as any,
      mockJwt,
      mockMail as any,
      mockStorage as any,
    );
  });

  describe('validateLocalUser', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.validateLocalUser('a@b.com', 'pw')).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: hash,
      });
      expect(await service.validateLocalUser('a@b.com', 'wrong')).toBeNull();
    });

    it('returns user when credentials are valid', async () => {
      const hash = await bcrypt.hash('correct', 10);
      const user = { id: '1', email: 'a@b.com', passwordHash: hash };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      expect(await service.validateLocalUser('a@b.com', 'correct')).toEqual(
        user,
      );
    });
  });

  describe('register', () => {
    it('throws ConflictException if email taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(
        service.register({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('hashToken / generateRawToken round-trip', () => {
    it('hash is deterministic', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });
    it('different inputs produce different hashes', () => {
      expect(hashToken('abc')).not.toBe(hashToken('xyz'));
    });
  });
});
