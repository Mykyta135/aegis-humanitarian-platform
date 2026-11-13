import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthedRequest, assertTaskAccess } from '../auth/access';
import { ChatService } from '../chat/chat.service';
import { OperationsGateway } from '../operations/operations.gateway';
import { RoutingService } from '../routing/routing.service';
import { ThreatZonesService } from '../threat-zones/threat-zones.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { randomUUID } from 'crypto';

@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly routingService: RoutingService,
    private readonly chatService: ChatService,
    private readonly gateway: OperationsGateway,
    private readonly threatZonesService: ThreatZonesService,
  ) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'The task has been successfully created.',
  })
  async create(@Req() req: any, @Body() createTaskDto: CreateTaskDto) {
    createTaskDto.creatorId = req.user?.id;
    const task = await this.tasksService.create(createTaskDto);
    this.gateway.sendNotification({
      id: randomUUID(),
      type: 'task_created',
      title: 'New Mission Created',
      message: `"${task.title}" assigned to ${task.assignee?.name ?? 'unknown'}`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      meta: { taskId: task.id, region: task.region },
    });
    return task;
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of tasks retrieved successfully.',
  })
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user?.id, req.user?.role);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Task retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update task fields (assignee, locations, skills, etc.) — creator or admin',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: AuthedRequest,
  ) {
    assertTaskAccess(req, await this.tasksService.findOne(id), {
      allowAssignee: false,
    });
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/arrive')
  @ApiOperation({
    summary:
      'Mark arrival at start point — logs the event, mission stays pending until volunteer starts it',
  })
  async arriveAtStart(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const actorId: string = req.user?.id;
    const task = await this.tasksService.arriveAtStart(id, actorId);
    this.gateway.sendNotification({
      id: randomUUID(),
      type: 'status_change',
      title: 'Volunteer Arrived',
      message: `${task.assignee?.name ?? 'Volunteer'} has arrived at the start point for "${task.title}"`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      meta: { taskId: task.id },
    });
    return task;
  }

  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start a mission — only the assigned volunteer may do this',
  })
  async startMission(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const actorId: string = req.user?.id;
    const task = await this.tasksService.startMission(id, actorId);
    this.gateway.sendNotification({
      id: randomUUID(),
      type: 'status_change',
      title: 'Mission Started',
      message: `"${task.title}" is now in progress`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      meta: { taskId: task.id },
    });
    return task;
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update mission status — assignee completes, creator or assignee cancels',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    const actorId: string = req.user?.id;
    const task = await this.tasksService.updateStatus(
      id,
      updateTaskStatusDto,
      actorId,
    );
    const type =
      updateTaskStatusDto.status === 'completed'
        ? 'task_completed'
        : 'task_cancelled';
    this.gateway.sendNotification({
      id: randomUUID(),
      type,
      title:
        type === 'task_completed' ? 'Mission Completed' : 'Mission Cancelled',
      message: `"${task.title}" — ${task.assignee?.name ?? 'unknown'}`,
      severity: type === 'task_completed' ? 'success' : 'warning',
      timestamp: new Date().toISOString(),
      meta: { taskId: task.id },
    });
    return task;
  }

  @Get(':id/route')
  @ApiOperation({ summary: 'Get the driving route for a task' })
  async getTaskRoute(@Param('id', ParseUUIDPipe) id: string) {
    const task = await this.tasksService.findOne(id);
    if (!task.startLocation || !task.endLocation) {
      throw new NotFoundException('Task does not have start or end locations.');
    }
    return this.routingService.getRoute(task.startLocation, task.endLocation);
  }

  @Get(':id/route-alternatives')
  @ApiOperation({
    summary: 'Get multiple route alternatives scored against threat zones',
  })
  async getRouteAlternatives(@Param('id', ParseUUIDPipe) id: string) {
    const task = await this.tasksService.findOne(id);
    if (!task.startLocation || !task.endLocation) {
      throw new NotFoundException('Task does not have start or end locations.');
    }
    const threatZones = await this.threatZonesService.getThreatZones();
    return this.routingService.getRouteAlternatives(
      task.startLocation,
      task.endLocation,
      threatZones,
    );
  }

  @Get(':id/route-conditioned')
  @ApiOperation({
    summary:
      'Get a route adjusted for field conditions (weather, load, threat zones, night, unpaved)',
  })
  async getConditionedRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('avoidThreatZones') avoidThreatZones?: string,
    @Query('weatherSeverity') weatherSeverity?: string,
    @Query('avoidUnpaved') avoidUnpaved?: string,
    @Query('nightMode') nightMode?: string,
    @Query('vehicleLoad') vehicleLoad?: string,
  ) {
    const task = await this.tasksService.findOne(id);
    if (!task.startLocation || !task.endLocation) {
      throw new NotFoundException('Task does not have start or end locations.');
    }

    const conditions = {
      avoidThreatZones: avoidThreatZones !== 'false',
      weatherSeverity: (['none', 'light', 'heavy'].includes(
        weatherSeverity ?? '',
      )
        ? weatherSeverity
        : 'none') as 'none' | 'light' | 'heavy',
      avoidUnpaved: avoidUnpaved === 'true',
      nightMode: nightMode === 'true',
      vehicleLoad: (['light', 'standard', 'heavy'].includes(vehicleLoad ?? '')
        ? vehicleLoad
        : 'standard') as 'light' | 'standard' | 'heavy',
    };

    let threatPolygons: number[][][][] | undefined;
    if (conditions.avoidThreatZones) {
      const zones = await this.threatZonesService.getThreatZones();
      threatPolygons = zones
        .filter((z) => z.geometry.type === 'Polygon')
        .map((z) => z.geometry.coordinates as number[][][]);
    }

    return this.routingService.getConditionedRoute(
      task.startLocation,
      task.endLocation,
      conditions,
      threatPolygons,
    );
  }

  @Get(':id/messages')
  async getMessagesForTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthedRequest,
  ) {
    assertTaskAccess(req, await this.tasksService.findOne(id), {
      allowAssignee: true,
    });
    return this.chatService.findMessagesForTask(id);
  }

  /** The author is the signed-in user, not a name sent by the client. */
  @Post(':id/logs')
  @ApiOperation({
    summary: 'Append a log entry to a task — creator, assignee or admin',
  })
  async addLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { message: string },
    @Req() req: AuthedRequest & { user: { name?: string } },
  ) {
    assertTaskAccess(req, await this.tasksService.findOne(id), {
      allowAssignee: true,
    });
    const message =
      typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 2000) {
      throw new BadRequestException('message must be 1–2000 characters');
    }
    return this.tasksService.addLog(id, message, req.user.name ?? req.user.id);
  }
}
