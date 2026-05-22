import { ConflictException, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.debug(`[validateUser] Searching for user with email: ${email}`);
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      this.logger.warn(`[validateUser] User not found with email: ${email}`);
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (isMatch) {
      this.logger.log(`[validateUser] Password match successful for user: ${email}`);
      const { password, ...result } = user;
      return result;
    } else {
      this.logger.warn(`[validateUser] Password mismatch for user: ${email}`);
      return null;
    }
  }

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    if (!dto.name || !dto.email || !dto.password) {
      throw new BadRequestException('Name, email, and password are required');
    }

    const existing = await this.usersService.findOneByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.VOLUNTEER,
      skills: dto.skills ?? [],
      languages: dto.languages ?? [],
    });

    this.logger.log(`New volunteer registered: ${user.email}`);
    return this.login(user);
  }

  async login(user: any): Promise<{ access_token: string }> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
