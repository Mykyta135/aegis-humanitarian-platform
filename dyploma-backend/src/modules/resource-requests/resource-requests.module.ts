import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceRequest } from './resource-request.entity';
import { ResourceRequestsController } from './resource-requests.controller';
import { ResourceRequestsService } from './resource-requests.service';
import { TasksModule } from '../tasks/tasks.module';
import { Resource } from '../resources/entities/resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceRequest, Resource]), TasksModule],
  controllers: [ResourceRequestsController],
  providers: [ResourceRequestsService],
  exports: [ResourceRequestsService],
})
export class ResourceRequestsModule {}
