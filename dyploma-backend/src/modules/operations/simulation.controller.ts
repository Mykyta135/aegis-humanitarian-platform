import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';

class StartSimDto {
  speedMultiplier?: number;
}

class SetSpeedDto {
  speedMultiplier: number;
}

class SeekDto {
  percent: number; // 0–100
}

@ApiTags('Simulation')
@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('status')
  @ApiOperation({ summary: 'List all running simulations' })
  getStatus() {
    return this.simulationService.getStatus();
  }

  @Post(':taskId/start')
  @ApiOperation({ summary: 'Start volunteer movement simulation for a task' })
  async start(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: StartSimDto,
  ) {
    return this.simulationService.startSimulation(taskId, dto.speedMultiplier ?? 5);
  }

  @Patch(':taskId/speed')
  @ApiOperation({ summary: 'Change speed of a running simulation' })
  setSpeed(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: SetSpeedDto,
  ) {
    return this.simulationService.setSpeed(taskId, dto.speedMultiplier ?? 5);
  }

  @Patch(':taskId/seek')
  @ApiOperation({ summary: 'Seek simulation to a percentage (0–100)' })
  seek(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: SeekDto,
  ) {
    return this.simulationService.seekSimulation(taskId, dto.percent);
  }

  @Delete(':taskId/stop')
  @ApiOperation({ summary: 'Stop simulation for a task' })
  stop(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.simulationService.stopSimulation(taskId);
  }

  @Delete('stop-all')
  @ApiOperation({ summary: 'Stop all running simulations' })
  stopAll() {
    this.simulationService.stopAll();
    return { message: 'All simulations stopped' };
  }
}
