import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { RoutingModule } from '../routing/routing.module';
import { OperationsGateway } from './operations.gateway';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    RoutingModule,
  ],
  providers: [OperationsGateway, OperationsService, SimulationService],
  exports: [OperationsGateway, SimulationService],
  controllers: [OperationsController, SimulationController],
})
export class OperationsModule {}
