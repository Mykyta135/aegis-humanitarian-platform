import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { User } from '../users/entities/user.entity';
import { Resource } from '../resources/entities/resource.entity';
import { RoutingModule } from '../routing/routing.module';
import { ThreatZonesModule } from '../threat-zones/threat-zones.module';
import { OperationsModule } from '../operations/operations.module';
import { ChatService } from '../chat/chat.service';
import { Message } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Resource, Message]), RoutingModule, ThreatZonesModule, OperationsModule],
  controllers: [TasksController],
  providers: [TasksService, ChatService],
  exports: [TasksService],
})
export class TasksModule {}
