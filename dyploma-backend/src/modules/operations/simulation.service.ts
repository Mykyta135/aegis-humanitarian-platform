import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { RoutingService } from '../routing/routing.service';
import { OperationsGateway } from './operations.gateway';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { decode } = require('@googlemaps/polyline-codec') as {
  decode: (encoded: string, precision?: number) => [number, number][];
};

interface SimulationState {
  taskId: string;
  volunteerId: string;
  volunteerName: string;
  points: [number, number][];
  currentIndex: number;
  intervalRef: ReturnType<typeof setInterval> | null;
  speedMultiplier: number;
}

// At speed×1: emit 1 point per second
// At speed×N: emit N points per second (interval = 1000/N ms, min 50ms)
const BASE_INTERVAL_MS = 1000;
const MIN_INTERVAL_MS = 50;

function tickIntervalMs(speed: number): number {
  return Math.max(MIN_INTERVAL_MS, Math.floor(BASE_INTERVAL_MS / speed));
}

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);
  private readonly simulations = new Map<string, SimulationState>();

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly routingService: RoutingService,
    private readonly gateway: OperationsGateway,
  ) {}

  async startSimulation(
    taskId: string,
    speedMultiplier = 1,
  ): Promise<{ message: string }> {
    if (this.simulations.has(taskId)) {
      return { message: 'Simulation already running for this task' };
    }

    const task = await this.tasksRepo.findOne({
      where: { id: taskId },
      relations: ['assignee'],
    });

    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== TaskStatus.IN_PROGRESS)
      throw new Error('Task must be in_progress to simulate');
    if (!task.startLocation || !task.endLocation)
      throw new Error('Task has no route coordinates');
    if (!task.assignee) throw new Error('Task has no assigned volunteer');

    const routeResult = await this.routingService.getRoute(
      task.startLocation,
      task.endLocation,
    );

    let points: [number, number][] = [];
    if (routeResult.route) {
      points = decode(routeResult.route);
    } else {
      const s = routeResult.snappedStart;
      const e = routeResult.snappedEnd;
      const STEPS = 100;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        points.push([s.lat + (e.lat - s.lat) * t, s.lng + (e.lng - s.lng) * t]);
      }
    }

    if (points.length === 0)
      throw new Error('Could not build route for simulation');

    const state: SimulationState = {
      taskId,
      volunteerId: task.assignee.id,
      volunteerName: task.assignee.name,
      points,
      currentIndex: 0,
      intervalRef: null,
      speedMultiplier,
    };

    const intervalMs = tickIntervalMs(speedMultiplier);

    state.intervalRef = setInterval(() => {
      this.safeTick(taskId);
    }, intervalMs);

    this.simulations.set(taskId, state);

    this.logger.log(
      `▶ Simulation started: task=${taskId} volunteer=${task.assignee.name} ` +
        `points=${points.length} speed=${speedMultiplier}× interval=${intervalMs}ms`,
    );

    return { message: `Simulation started for "${task.assignee.name}"` };
  }

  stopSimulation(taskId: string): { message: string } {
    const state = this.simulations.get(taskId);
    if (!state) return { message: 'No simulation running for this task' };

    if (state.intervalRef) clearInterval(state.intervalRef);
    this.simulations.delete(taskId);

    this.logger.log(`⏹ Simulation stopped: task=${taskId}`);
    return { message: 'Simulation stopped' };
  }

  stopAll(): void {
    for (const [taskId] of this.simulations) {
      this.stopSimulation(taskId);
    }
  }

  getStatus(): {
    taskId: string;
    volunteerId: string;
    volunteerName: string;
    progress: number;
    speed: number;
    totalPoints: number;
    currentIndex: number;
  }[] {
    return [...this.simulations.values()].map((s) => ({
      taskId: s.taskId,
      volunteerId: s.volunteerId,
      volunteerName: s.volunteerName,
      progress: Math.round(
        (s.currentIndex / Math.max(s.points.length - 1, 1)) * 100,
      ),
      speed: s.speedMultiplier,
      totalPoints: s.points.length,
      currentIndex: s.currentIndex,
    }));
  }

  /** Seek to a percentage 0–100 (pause not needed; just updates index) */
  seekSimulation(taskId: string, percent: number): { message: string } {
    const state = this.simulations.get(taskId);
    if (!state) return { message: 'No simulation running for this task' };
    const clamped = Math.max(0, Math.min(100, percent));
    state.currentIndex = Math.round(
      (clamped / 100) * (state.points.length - 1),
    );
    return { message: `Seeked to ${clamped}%` };
  }

  /** Change speed of a running simulation without restarting it */
  setSpeed(taskId: string, speedMultiplier: number): { message: string } {
    const state = this.simulations.get(taskId);
    if (!state) return { message: 'No simulation running for this task' };

    if (state.intervalRef) clearInterval(state.intervalRef);
    state.speedMultiplier = speedMultiplier;
    const intervalMs = tickIntervalMs(speedMultiplier);

    state.intervalRef = setInterval(() => {
      this.safeTick(taskId);
    }, intervalMs);

    this.logger.log(
      `⚡ Speed changed: task=${taskId} speed=${speedMultiplier}× interval=${intervalMs}ms`,
    );
    return { message: `Speed set to ${speedMultiplier}×` };
  }

  /** Runs inside setInterval: an exception here would crash the whole process. */
  private safeTick(taskId: string): void {
    try {
      this.tick(taskId);
    } catch (err) {
      this.logger.error(
        `Simulation tick failed, stopping task=${taskId}`,
        err instanceof Error ? err.stack : String(err),
      );
      this.stopSimulation(taskId);
    }
  }

  private tick(taskId: string): void {
    const state = this.simulations.get(taskId);
    if (!state) return;

    const point = state.points[state.currentIndex];
    if (!point)
      throw new Error(
        `index ${state.currentIndex} outside route of ${state.points.length} points`,
      );
    const [lat, lng] = point;
    this.gateway.sendLocationUpdate({
      userId: state.volunteerId,
      location: { lat, lng },
      taskId,
    });

    state.currentIndex++;

    if (state.currentIndex >= state.points.length) {
      state.currentIndex = state.points.length - 1;

      // Broadcast completion event before stopping
      this.gateway.sendSimulationComplete({
        taskId,
        volunteerId: state.volunteerId,
        volunteerName: state.volunteerName,
      });

      this.stopSimulation(taskId);
      this.logger.log(`✅ Simulation complete: task=${taskId}`);
    }
  }
}
