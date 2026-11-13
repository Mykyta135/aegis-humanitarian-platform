import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { SeedService } from './seed.service';

/**
 * Demo data loader. It creates admin accounts with known passwords, so it is
 * public only when ENABLE_SEED=true (set in docker-compose for local demos).
 * Anywhere else the route answers 404, as if it did not exist.
 */
export function seedEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_SEED === 'true' && env.NODE_ENV !== 'production';
}

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seed() {
    if (!seedEnabled()) {
      throw new NotFoundException();
    }
    await this.seedService.seed();
    return { message: 'Database seeded successfully' };
  }
}
