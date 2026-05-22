import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Resource } from '../resources/entities/resource.entity';
import { Task } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Resource, Task])],
  controllers: [SeedController],
  providers: [SeedService, TasksService],
})
export class SeedModule {}
