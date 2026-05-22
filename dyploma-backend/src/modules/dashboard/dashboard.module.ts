import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from '../resources/entities/resource.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  // We only need the Resource entity for this insight
  imports: [TypeOrmModule.forFeature([Resource, Task, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
