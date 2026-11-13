// backend/src/app.module.ts

import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OperationsGateway } from './modules/operations/operations.gateway';
import { OperationsModule } from './modules/operations/operations.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { RoutingModule } from './modules/routing/routing.module';
import { SeedModule } from './modules/seed/seed.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ThreatZonesModule } from './modules/threat-zones/threat-zones.module';
import { VolunteerRequestsModule } from './modules/volunteer-requests/volunteer-requests.module';
import { ResourceRequestsModule } from './modules/resource-requests/resource-requests.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT')!),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true, // Автоматично завантажувати всі Entities
        // Schema changes go through migrations only (src/database/migrations);
        // pending ones run on start, so `docker compose up` still just works.
        synchronize: false,
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        migrationsRun: true,
      }),
    }),
    UsersModule,
    ResourcesModule,
    TasksModule,
    SeedModule,
    DashboardModule,
    SuggestionsModule,
    AuthModule,
    RoutingModule,
    OperationsModule,
    ChatModule,
    ThreatZonesModule,
    VolunteerRequestsModule,
    ResourceRequestsModule,
  ],
  controllers: [],
  providers: [OperationsGateway, ChatGateway],
})
export class AppModule {}
