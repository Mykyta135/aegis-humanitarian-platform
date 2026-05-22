import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Resource,
  ResourceStatus,
} from '../resources/entities/resource.entity';
import {
  ExperienceLevel,
  User,
  UserStatus,
} from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './entities/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskLogEntry } from './entities/task.entity';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

export class UserFilterDto {
  experienceLevel?: ExperienceLevel;
  homeBase?: string;
  skill?: string;
  name?: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
  ) {}

  private appendLog(task: Task, message: string, author = 'System'): void {
    const entry: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      message,
      author,
    };
    task.logs = [...(task.logs ?? []), entry];
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const {
      assigneeId,
      resourceIds,
      title,
      description,
      region,
      priority,
      difficulty,
      requiredSkills,
      requiredResources,
      estimatedDurationHours,
      startLocation,
      endLocation,
      creatorId,
    } = createTaskDto;

    const assignee = assigneeId
      ? await this.usersRepository.findOneBy({ id: assigneeId })
      : null;
    if (assigneeId && !assignee) {
      throw new NotFoundException(`User with ID "${assigneeId}" not found`);
    }

    const safeResourceIds = resourceIds ?? [];
    const resources = safeResourceIds.length
      ? await this.resourcesRepository.findBy({ id: In(safeResourceIds) })
      : [];
    if (resources.length !== safeResourceIds.length) {
      throw new NotFoundException(`One or more resources not found`);
    }

    const task = this.tasksRepository.create({
      title,
      description,
      priority,
      difficulty,
      requiredSkills,
      requiredResources,
      estimatedDurationHours,
      region,
      startLocation,
      endLocation,
      creatorId,
      ...(assignee ? { assignee } : {}),
      resources,
      logs: [],
    });

    this.appendLog(task, `Mission created: "${title}"`);
    if (assignee) {
      this.appendLog(task, `Volunteer assigned: ${assignee.name}`);
    }

    const savedTask = await this.tasksRepository.save(task);

    if (assignee && assigneeId) {
      await this.usersRepository.update(assigneeId, {
        status: UserStatus.ON_MISSION,
      });
    }

    if (safeResourceIds.length > 0) {
      await this.resourcesRepository.update(safeResourceIds, {
        status: ResourceStatus.IN_USE,
      });
    }

    return savedTask;
  }

  async findAll(callerId?: string, callerRole?: string): Promise<Task[]> {
    if (callerRole === 'admin') {
      return this.tasksRepository.find({ relations: ['assignee', 'resources'] });
    }
    // Volunteers see only missions they are assigned to or created.
    // Use a raw query to avoid TypeORM eager-loading interference with WHERE.
    const rows: { id: string }[] = await this.tasksRepository.query(
      `SELECT id FROM tasks WHERE "assigneeId" = $1 OR "creatorId" = $1`,
      [callerId],
    );
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    return this.tasksRepository.find({
      where: { id: In(ids) },
      relations: ['assignee', 'resources'],
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'resources', 'creator'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  async addLog(id: string, message: string, author?: string): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);
    this.appendLog(task, message, author);
    return this.tasksRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'resources'],
    });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);

    // Handle assignee change
    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assignee?.id) {
      const prevName = task.assignee?.name ?? 'none';
      if (task.assignee) {
        await this.usersRepository.update(task.assignee.id, { status: UserStatus.AVAILABLE });
      }
      if (dto.assigneeId) {
        const newAssignee = await this.usersRepository.findOneBy({ id: dto.assigneeId });
        if (!newAssignee) throw new NotFoundException(`User "${dto.assigneeId}" not found`);
        task.assignee = newAssignee;
        await this.usersRepository.update(dto.assigneeId, { status: UserStatus.ON_MISSION });
        this.appendLog(task, `Volunteer reassigned from ${prevName} to ${newAssignee.name}`);
      } else {
        task.assignee = null as any;
        this.appendLog(task, `Volunteer ${prevName} removed from mission`);
      }
    }

    // Handle scalar fields
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.region !== undefined) task.region = dto.region as any;
    if (dto.priority !== undefined) task.priority = dto.priority as any;
    if (dto.difficulty !== undefined) task.difficulty = dto.difficulty as any;
    if (dto.requiredSkills !== undefined) task.requiredSkills = dto.requiredSkills;
    if (dto.estimatedDurationHours !== undefined) task.estimatedDurationHours = dto.estimatedDurationHours;
    if (dto.startLocation !== undefined) task.startLocation = dto.startLocation as any;
    if (dto.endLocation !== undefined) task.endLocation = dto.endLocation as any;

    return this.tasksRepository.save(task);
  }

  async startMission(id: string, actorId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'resources'],
    });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);
    if (!task.assignee || task.assignee.id !== actorId) {
      throw new ForbiddenException('Only the assigned volunteer can start this mission');
    }
    await this.usersRepository.update(task.assignee.id, { status: UserStatus.ON_MISSION });
    task.status = TaskStatus.IN_PROGRESS;
    this.appendLog(task, `Mission started — ${task.assignee.name}`);
    return this.tasksRepository.save(task);
  }

  async arriveAtStart(id: string, actorId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'resources'],
    });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);
    if (!task.assignee || task.assignee.id !== actorId) {
      throw new ForbiddenException('Only the assigned volunteer can mark arrival');
    }
    if (task.status !== TaskStatus.PENDING) {
      throw new ForbiddenException('Mission must be pending to mark arrival');
    }
    this.appendLog(task, `Volunteer ${task.assignee.name} has arrived at the start point`);
    return this.tasksRepository.save(task);
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    actorId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'resources'],
    });
    if (!task) throw new NotFoundException(`Task with ID "${id}" not found`);

    const isAssignee = task.assignee?.id === actorId;
    const isCreator  = task.creatorId === actorId;
    const { status } = updateTaskStatusDto;

    if (status === 'completed' && !isAssignee) {
      throw new ForbiddenException('Only the assigned volunteer can complete this mission');
    }
    if (status === 'cancelled' && !isAssignee && !isCreator) {
      throw new ForbiddenException('Only the mission creator or assigned volunteer can cancel');
    }

    const isTerminal = status === 'completed' || status === 'cancelled';

    if (isTerminal) {
      if (task.assignee) {
        await this.usersRepository.update(task.assignee.id, { status: UserStatus.AVAILABLE });
      }
      if (task.resources?.length > 0) {
        const resourceIds = task.resources.map((r) => r.id);
        await this.resourcesRepository.update(resourceIds, { status: ResourceStatus.AVAILABLE });
      }
      const label = status === 'completed' ? 'Mission completed' : 'Mission cancelled';
      this.appendLog(task, `${label}${task.assignee ? ` — ${task.assignee.name}` : ''}`);
    }

    task.status = updateTaskStatusDto.status;
    return this.tasksRepository.save(task);
  }
}
