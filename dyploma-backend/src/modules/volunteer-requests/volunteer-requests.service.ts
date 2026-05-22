import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolunteerRequest, RequestStatus } from './volunteer-request.entity';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class VolunteerRequestsService {
  constructor(
    @InjectRepository(VolunteerRequest)
    private readonly repo: Repository<VolunteerRequest>,
    private readonly tasksService: TasksService,
  ) {}

  async create(taskId: string, requesterId: string, targetId: string, message?: string) {
    const req = this.repo.create({ taskId, requesterId, targetId, message });
    return this.repo.save(req);
  }

  findForTask(taskId: string) {
    return this.repo.find({ where: { taskId } });
  }

  findForUser(userId: string) {
    return this.repo.find({ where: { targetId: userId } });
  }

  async respond(id: string, userId: string, accept: boolean) {
    const req = await this.repo.findOneBy({ id });
    if (!req) throw new NotFoundException(`Request ${id} not found`);
    if (req.targetId !== userId) throw new ForbiddenException('Not your request');
    if (req.status !== RequestStatus.PENDING) throw new ForbiddenException('Already responded');

    req.status = accept ? RequestStatus.ACCEPTED : RequestStatus.REJECTED;
    const saved = await this.repo.save(req);

    if (accept) {
      await this.tasksService.update(req.taskId, { assigneeId: userId });
      await this.tasksService.addLog(
        req.taskId,
        `Volunteer ${req.target?.name ?? userId} accepted the mission request`,
        'System',
      );
    } else {
      await this.tasksService.addLog(
        req.taskId,
        `Volunteer ${req.target?.name ?? userId} declined the mission request`,
        'System',
      );
    }

    return saved;
  }
}
