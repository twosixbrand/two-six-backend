import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;
  let clsService: ClsService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockClsService = {
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: mockReflector },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
    clsService = module.get<ClsService>(ClsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnValue({
          headers: {},
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };
    });

    it('should return true if route is public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso no proporcionado.'),
      );
    });

    it('should throw UnauthorizedException if token format is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockContext.getRequest.mockReturnValue({
        headers: { authorization: 'InvalidToken abc' },
      });

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso no proporcionado.'),
      );
    });

    it('should throw UnauthorizedException if token is invalid or expired', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockContext.getRequest.mockReturnValue({
        headers: { authorization: 'Bearer invalid-token' },
      });
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso inválido o expirado.'),
      );
    });

    it('should allow access and set CLS if token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const payload = { sub: 1, email: 'test@test.com' };
      mockContext.getRequest.mockReturnValue({
        headers: { authorization: 'Bearer valid-token' },
        user: null,
      });
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(mockClsService.set).toHaveBeenCalledWith('userId', payload.sub);
      expect(mockClsService.set).toHaveBeenCalledWith('userEmail', payload.email);
    });

    it('should throw UnauthorizedException if required permissions are missing', async () => {
      mockReflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['admin:read'];
        return null;
      });

      const payload = { sub: 1, email: 'test@test.com', permissions: ['user:read'] };
      const req = {
        headers: { authorization: 'Bearer valid-token' },
        user: payload,
      };
      mockContext.getRequest.mockReturnValue(req);
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      await expect(guard.canActivate(mockContext as ExecutionContext)).rejects.toThrow(
        new UnauthorizedException('No tienes los permisos necesarios para realizar esta acción.'),
      );
    });

    it('should allow access if all required permissions are present', async () => {
      mockReflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['admin:read', 'admin:write'];
        return null;
      });

      const payload = { sub: 1, email: 'test@test.com', permissions: ['admin:read', 'admin:write', 'user:read'] };
      const req = {
        headers: { authorization: 'Bearer valid-token' },
        user: payload,
      };
      mockContext.getRequest.mockReturnValue(req);
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
    });
  });
});
