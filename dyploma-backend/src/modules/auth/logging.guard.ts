import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingGuard implements CanActivate {
  private readonly logger = new Logger(LoggingGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    this.logger.log('--- NEW REQUEST TO PROTECTED ROUTE ---');

    // Log the Authorization header specifically
    const authHeader = headers['authorization'];
    if (authHeader) {
      this.logger.log(`Authorization Header FOUND: ${authHeader}`);
    } else {
      this.logger.error('Authorization Header MISSING!');
    }

    // Log all headers for complete debugging
    // this.logger.debug('All Headers:', JSON.stringify(headers, null, 2));

    this.logger.log('Passing control to JwtAuthGuard...');

    // Always return true so the next guard in the chain (JwtAuthGuard) can run.
    return true;
  }
}
