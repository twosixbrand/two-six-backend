import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let mailerService: MailerService;

  const mockPrisma = {
    customer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userApp: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── loginCustomer ──────────────────────────────────────────────────

  describe('loginCustomer', () => {
    it('should throw NotFoundException if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.loginCustomer('notfound@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate OTP, update customer, and send email', async () => {
      const customer = { id: 1, name: 'Juan', email: 'juan@test.com' };
      mockPrisma.customer.findFirst.mockResolvedValue(customer);
      mockPrisma.customer.update.mockResolvedValue(customer);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.loginCustomer('JUAN@TEST.COM');

      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { email: 'juan@test.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          otp: 'hashed-otp',
          otpExpiresAt: expect.any(Date),
        }),
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'juan@test.com',
          subject: expect.stringContaining('Código de Acceso'),
        }),
      );
      expect(result).toEqual({
        message: 'Se ha enviado un código de acceso a tu correo electrónico.',
      });
    });
  });

  // ─── registerCustomer ───────────────────────────────────────────────

  describe('registerCustomer', () => {
    const dto = {
      email: 'new@test.com',
      document_number: '123456',
      id_identification_type: 1,
      name: 'Ana',
      phone: '3001234567',
    };

    it('should throw UnauthorizedException if email already exists', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 99 });

      await expect(service.registerCustomer(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if document already exists', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findUnique.mockResolvedValue({ id: 99 });

      await expect(service.registerCustomer(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create customer, hash OTP, and send email', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      const createdCustomer = { id: 10, name: 'Ana', email: 'new@test.com' };
      mockPrisma.customer.create.mockResolvedValue(createdCustomer);
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.registerCustomer(dto);

      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          document_number: '123456',
          name: 'Ana',
          email: 'new@test.com',
          otp: 'hashed-otp',
          is_registered: false,
        }),
      });
      expect(mockMailerService.sendMail).toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'Se ha enviado un código de acceso a tu correo electrónico nuevo.',
      });
    });

    it('should use default id_identification_type if not provided', async () => {
      const dtoNoId = { ...dto };
      delete (dtoNoId as any).id_identification_type;

      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      mockPrisma.customer.create.mockResolvedValue({ id: 10, name: 'Ana', email: 'new@test.com' });
      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.registerCustomer(dtoNoId as any);

      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_identification_type: 1,
        }),
      });
    });
  });

  // ─── verifyCustomerOtp ──────────────────────────────────────────────

  describe('verifyCustomerOtp', () => {
    it('should throw UnauthorizedException if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyCustomerOtp('nobody@test.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP not set', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        otp: null,
        otpExpiresAt: null,
      });

      await expect(
        service.verifyCustomerOtp('a@b.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP is expired', async () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        otp: 'hashed',
        otpExpiresAt: expiredDate,
      });
      mockPrisma.customer.update.mockResolvedValue({});

      await expect(
        service.verifyCustomerOtp('a@b.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);

      // Should clear expired OTP
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { otp: null, otpExpiresAt: null },
      });
    });

    it('should throw UnauthorizedException if OTP is incorrect', async () => {
      const futureDate = new Date(Date.now() + 600000);
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        otp: 'hashed-otp',
        otpExpiresAt: futureDate,
        addresses: [],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyCustomerOtp('a@b.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and customer on valid OTP', async () => {
      const futureDate = new Date(Date.now() + 600000);
      const customer = {
        id: 5,
        email: 'a@b.com',
        name: 'Test',
        document_number: '111',
        id_identification_type: 1,
        current_phone_number: '300',
        shipping_address: 'Calle 1',
        city: 'Medellin',
        state: 'Antioquia',
        postal_code: '050001',
        country: 'Colombia',
        otp: 'hashed-otp',
        otpExpiresAt: futureDate,
        addresses: [],
      };
      mockPrisma.customer.findFirst.mockResolvedValue(customer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.customer.update.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.verifyCustomerOtp('A@B.COM', '123456');

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.customer.id).toBe(5);
      expect(result.customer.is_registered).toBe(true);
      expect(result.customer.addresses).toEqual([]);

      // Should clear OTP and mark as registered
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { otp: null, otpExpiresAt: null, is_registered: true },
      });

      // JWT payload should include role: customer
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 5,
        email: 'a@b.com',
        role: 'customer',
        name: 'Test',
      });
    });
  });

  // ─── login (UserApp) ────────────────────────────────────────────────
  describe('login', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.userApp.findUnique.mockResolvedValue(null);
      await expect(service.login('ghost@test.com')).rejects.toThrow(NotFoundException);
    });

    it('should generate OTP, hash it, and send email', async () => {
      const user = { id: 1, email: 'admin@test.com', name: 'Admin' };
      mockPrisma.userApp.findUnique.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      mockPrisma.userApp.update.mockResolvedValue({});
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.login('admin@test.com');

      expect(result.message).toContain('código OTP');
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });

    it('should bypass email for twosixmarca@gmail.com', async () => {
      const user = { id: 2, email: 'twosixmarca@gmail.com', name: 'E2E' };
      mockPrisma.userApp.findUnique.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.userApp.update.mockResolvedValue({});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.login('twosixmarca@gmail.com');

      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[E2E Bypass]'));
      consoleSpy.mockRestore();
    });
  });

  // ─── verifyOtp (UserApp) ─────────────────────────────────────────────
  describe('verifyOtp', () => {
    it('should throw UnauthorizedException if OTP not requested', async () => {
      mockPrisma.userApp.findUnique.mockResolvedValue({ id: 1, otp: null });
      await expect(service.verifyOtp('a@b.com', '123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      mockPrisma.userApp.findUnique.mockResolvedValue({ id: 1, otp: 'h', otpExpiresAt: expiredDate });
      mockPrisma.userApp.update.mockResolvedValue({});
      await expect(service.verifyOtp('a@b.com', '123')).rejects.toThrow('El OTP ha expirado.');
    });

    it('should throw UnauthorizedException if OTP incorrect', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockPrisma.userApp.findUnique.mockResolvedValue({ id: 1, otp: 'hashed', otpExpiresAt: futureDate });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.verifyOtp('a@b.com', 'wrong')).rejects.toThrow('El OTP es incorrecto.');
    });

    it('should return token and roles/permissions on valid OTP', async () => {
      const futureDate = new Date(Date.now() + 100000);
      const user = { id: 1, email: 'a@b.com', otp: 'h', otpExpiresAt: futureDate };
      const roleData = [
        {
          role: {
            name: 'ADMIN',
            rolePermissions: [{ permission: { code: 'READ_ALL' } }],
          },
        },
      ];
      mockPrisma.userApp.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.userRole.findMany.mockResolvedValue(roleData);
      mockPrisma.userApp.update.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.verifyOtp('a@b.com', '123');

      expect(result.accessToken).toBe('token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
        roles: ['ADMIN'],
        permissions: ['READ_ALL'],
      }));
    });

    it('should bypass verification for twosixmarca@gmail.com with 999999', async () => {
      const user = { id: 2, email: 'twosixmarca@gmail.com' };
      mockPrisma.userApp.findUnique.mockResolvedValue(user);
      mockPrisma.userRole.findMany.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('bypass-token');

      const result = await service.verifyOtp('twosixmarca@gmail.com', '999999');

      expect(result.accessToken).toBe('bypass-token');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on bypass if user not found', async () => {
      mockPrisma.userApp.findUnique.mockResolvedValue(null);
      await expect(service.verifyOtp('twosixmarca@gmail.com', '999999')).rejects.toThrow(UnauthorizedException);
    });
  });
});
