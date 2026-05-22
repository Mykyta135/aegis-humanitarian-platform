import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerRequest } from './volunteer-request.entity';
import { VolunteerRequestsController } from './volunteer-requests.controller';
import { VolunteerRequestsService } from './volunteer-requests.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([VolunteerRequest]), TasksModule],
  controllers: [VolunteerRequestsController],
  providers: [VolunteerRequestsService],
  exports: [VolunteerRequestsService],
})
export class VolunteerRequestsModule {}
