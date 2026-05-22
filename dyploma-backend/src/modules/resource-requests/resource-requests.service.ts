import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceRequest, ResourceRequestStatus } from './resource-request.entity';
import { TasksService } from '../tasks/tasks.service';
import { Resource, ResourceStatus } from '../resources/entities/resource.entity';

@Injectable()
export class ResourceRequestsService {
  constructor(
    @InjectRepository(ResourceRequest)
    private readonly repo: Repository<ResourceRequest>,
    @InjectRepository(Resource)
    private readonly resourcesRepo: Repository<Resource>,
    private readonly tasksService: TasksService,
  ) {}

  async create(taskId: string, resourceId: string, requesterId: string, message?: string) {
    const existing = await this.repo.findOne({
      where: { taskId, resourceId, status: ResourceRequestStatus.PENDING },
    });
    if (existing) return existing;

    const req = this.repo.create({ taskId, resourceId, requesterId, message });
    const saved = await this.repo.save(req);
    await this.tasksService.addLog(taskId, `Resource request sent for: ${saved.resource?.name ?? resourceId}`, 'System');
    return saved;
  }

  findForTask(taskId: string) {
    return this.repo.find({ where: { taskId } });
  }

  findForResource(resourceId: string) {
    return this.repo.find({ where: { resourceId, status: ResourceRequestStatus.PENDING } });
  }

  async respond(id: string, actorId: string, approve: boolean) {
    const req = await this.repo.findOneBy({ id });
    if (!req) throw new NotFoundException(`Resource request ${id} not found`);
    if (req.status !== ResourceRequestStatus.PENDING) throw new ForbiddenException('Already responded');

    const task = await this.tasksService.findOne(req.taskId);
    if (task.creatorId !== actorId) {
      throw new ForbiddenException('Only the mission creator can approve or reject resource requests');
    }

    req.status = approve ? ResourceRequestStatus.APPROVED : ResourceRequestStatus.REJECTED;
    const saved = await this.repo.save(req);

    if (approve) {
      await this.resourcesRepo.update(req.resourceId, { status: ResourceStatus.IN_USE });
      const currentIds = (task.resources ?? []).map((r) => r.id);
      if (!currentIds.includes(req.resourceId)) {
        await this.tasksService.update(req.taskId, {
          resourceIds: [...currentIds, req.resourceId],
        } as any);
      }
      await this.tasksService.addLog(
        req.taskId,
        `Resource "${req.resource?.name ?? req.resourceId}" approved and assigned to mission`,
        'System',
      );
    } else {
      await this.tasksService.addLog(
        req.taskId,
        `Resource "${req.resource?.name ?? req.resourceId}" request rejected`,
        'System',
      );
    }

    return saved;
  }
}
