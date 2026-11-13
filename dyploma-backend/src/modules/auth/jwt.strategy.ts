import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'; // <-- Import Logger
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { requireJwtSecret } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: requireJwtSecret(config.get<string>('JWT_SECRET')),
    });
    this.logger.log('JwtStrategy has been initialized.');
  }

  async validate(payload: any): Promise<any> {
    this.logger.log('--- JWT VALIDATE METHOD CALLED ---');
    this.logger.debug(`Payload received: ${JSON.stringify(payload)}`);

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      this.logger.warn(
        `Validation failed: User with ID ${payload.sub} from token not found in DB.`,
      );
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.log(`Validation successful for user: ${user.email}`);
    this.logger.log('----------------------------------');

    const { password, ...result } = user;
    return result;
  }
}
