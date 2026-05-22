import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, RegisterDto } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Please check your email and password.');
    }

    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Self-register as a volunteer' })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${dto.email}`);
    return this.authService.register(dto);
  }
}
