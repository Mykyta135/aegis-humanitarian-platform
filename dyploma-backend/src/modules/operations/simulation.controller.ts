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
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';

// The global ValidationPipe runs with whitelist: true, so every field needs a
// class-validator decorator; an undecorated field is silently stripped.
// Bounds match the speed slider in SimulationPanel (1–50).
export const MIN_SPEED = 1;
export const MAX_SPEED = 50;

export class StartSimDto {
  @IsOptional()
  @IsNumber()
  @Min(MIN_SPEED)
  @Max(MAX_SPEED)
  speedMultiplier?: number;
}

export class SetSpeedDto {
  @IsNumber()
  @Min(MIN_SPEED)
  @Max(MAX_SPEED)
  speedMultiplier: number;
}

export class SeekDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number;
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
    return this.simulationService.startSimulation(
      taskId,
      dto.speedMultiplier ?? 5,
    );
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
  seek(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: SeekDto) {
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
