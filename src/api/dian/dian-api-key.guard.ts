import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard para proteger el endpoint de Facturación Electrónica.
 * Permite que aplicativos externos consuman el API mediante el header 'x-api-key'.
 */
@Injectable()
export class DianApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('DIAN_API_KEY');

    if (!validKey) {
      throw new UnauthorizedException(
        'API Key de integración no configurada en el servidor',
      );
    }

    if (apiKey && apiKey === validKey) {
      return true;
    }

    throw new UnauthorizedException(
      'API Key inválida o no proporcionada en el header x-api-key',
    );
  }
}
