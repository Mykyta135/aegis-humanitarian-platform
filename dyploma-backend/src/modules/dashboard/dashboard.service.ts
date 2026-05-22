import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import {
  Resource,
  ResourceStatus,
  ResourceType,
} from '../resources/entities/resource.entity';
import { MissionRegion, Task, TaskStatus } from '../tasks/entities/task.entity';
import { User, UserStatus } from '../users/entities/user.entity';

export interface InsightAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  source: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getInsights(): Promise<InsightAlert[]> {
    const alerts: InsightAlert[] = [];

    // Resource scarcity
    const availableResources = await this.resourcesRepository.find({
      where: { status: ResourceStatus.AVAILABLE },
    });
    const availableVehicles = availableResources.filter(
      (r) => r.type === ResourceType.VEHICLE,
    );
    if (availableVehicles.length === 0) {
      alerts.push({ type: 'critical', message: 'No vehicles are currently available.', source: 'Resource Analysis' });
    } else if (availableVehicles.length <= 1) {
      alerts.push({ type: 'warning', message: `Only ${availableVehicles.length} vehicle available.`, source: 'Resource Analysis' });
    }

    // Route safety
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const recentTasks = await this.tasksRepository.find({
      where: { updatedAt: MoreThan(twoDaysAgo), status: In([TaskStatus.COMPLETED, TaskStatus.CANCELLED]) },
    });
    const regionStats = new Map<MissionRegion, { completed: number; cancelled: number }>();
    for (const task of recentTasks) {
      if (!task.region) continue;
      if (!regionStats.has(task.region)) regionStats.set(task.region, { completed: 0, cancelled: 0 });
      const s = regionStats.get(task.region)!;
      if (task.status === TaskStatus.COMPLETED) s.completed++;
      else s.cancelled++;
    }
    for (const [region, stats] of regionStats.entries()) {
      const total = stats.completed + stats.cancelled;
      if (total >= 2) {
        const rate = stats.completed / total;
        if (rate >= 0.75) {
          alerts.push({ type: 'info', message: `${region.charAt(0).toUpperCase() + region.slice(1)} has ${Math.round(rate * 100)}% mission success rate in 48h.`, source: 'Route Safety' });
        } else if (rate < 0.4) {
          alerts.push({ type: 'warning', message: `${region.charAt(0).toUpperCase() + region.slice(1)} has a low success rate (${Math.round(rate * 100)}%) — review conditions.`, source: 'Route Safety' });
        }
      }
    }

    return alerts;
  }

  async getAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // KPI counters
    const totalTasks = await this.tasksRepository.count();
    const completedTasks = await this.tasksRepository.count({ where: { status: TaskStatus.COMPLETED } });
    const inProgressTasks = await this.tasksRepository.count({ where: { status: TaskStatus.IN_PROGRESS } });
    const totalVolunteers = await this.usersRepository.count();
    const availableVolunteers = await this.usersRepository.count({ where: { status: UserStatus.AVAILABLE } });
    const totalResources = await this.resourcesRepository.count();
    const availableResources = await this.resourcesRepository.count({ where: { status: ResourceStatus.AVAILABLE } });
    const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const kpis = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      successRate,
      totalVolunteers,
      availableVolunteers,
      totalResources,
      availableResources,
    };

    // Tasks over time
    const tasksOverTime = await this.tasksRepository
      .createQueryBuilder('task')
      .select("DATE_TRUNC('day', task.createdAt) as date")
      .addSelect('COUNT(*) as created')
      .addSelect("COUNT(*) FILTER (WHERE task.status = 'completed') as completed")
      .where('task.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Status breakdown
    const statusBreakdown = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status')
      .getRawMany();

    // Active volunteers
    const activeVolunteers = await this.tasksRepository
      .createQueryBuilder('task')
      .select('user.name', 'name')
      .addSelect('COUNT(task.id)', 'completedMissions')
      .innerJoin('task.assignee', 'user')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .groupBy('user.name')
      .orderBy('"completedMissions"', 'DESC')
      .limit(8)
      .getRawMany();

    // Resource utilization
    const resourceUtilization = await this.resourcesRepository
      .createQueryBuilder('resource')
      .select('resource.type', 'type')
      .addSelect("COUNT(*) FILTER (WHERE resource.status = 'in_use') as inUseCount")
      .addSelect("COUNT(*) FILTER (WHERE resource.status = 'available') as availableCount")
      .groupBy('resource.type')
      .getRawMany();

    // Skill distribution
    const allUsers = await this.usersRepository.find({ select: ['skills', 'status'] });
    const skillCounts: Record<string, { total: number; available: number }> = {};
    for (const user of allUsers) {
      for (const skill of user.skills) {
        if (!skillCounts[skill]) skillCounts[skill] = { total: 0, available: 0 };
        skillCounts[skill].total++;
        if (user.status === UserStatus.AVAILABLE) skillCounts[skill].available++;
      }
    }
    const skillDistribution = Object.entries(skillCounts)
      .map(([skill, counts]) => ({ skill, count: String(counts.total), available: String(counts.available) }))
      .sort((a, b) => Number(b.count) - Number(a.count));

    // Mission success by region
    const missionSuccessByRegion = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.region', 'region')
      .addSelect(
        `CAST(COUNT(*) FILTER (WHERE task.status = 'completed') AS REAL) / NULLIF(COUNT(*) FILTER (WHERE task.status IN ('completed', 'cancelled')), 0) * 100`,
        'successRate',
      )
      .addSelect('COUNT(*)', 'total')
      .where('task.region IS NOT NULL')
      .groupBy('task.region')
      .orderBy('"successRate"', 'DESC')
      .getRawMany();

    // Avg duration
    const avgMissionDuration = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.region', 'region')
      .addSelect('AVG(EXTRACT(EPOCH FROM (task.updatedAt - task.createdAt)))', 'avgDurationSeconds')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .groupBy('task.region')
      .orderBy('"avgDurationSeconds"', 'ASC')
      .getRawMany();

    // Duration vs estimate by difficulty
    const durationComparison = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.difficulty', 'difficulty')
      .addSelect('AVG(task.estimatedDurationHours)', 'avgEstimatedHours')
      .addSelect('AVG(EXTRACT(EPOCH FROM (task.updatedAt - task.createdAt)) / 3600)', 'avgActualHours')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.estimatedDurationHours IS NOT NULL')
      .groupBy('task.difficulty')
      .getRawMany();

    // Mission count by day of week (heatmap data)
    const missionsByDayOfWeek = await this.tasksRepository
      .createQueryBuilder('task')
      .select('EXTRACT(DOW FROM task.createdAt)::int', 'dow')
      .addSelect('task.region', 'region')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dow, task.region')
      .orderBy('dow', 'ASC')
      .getRawMany();

    // Priority breakdown
    const priorityBreakdown = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .addSelect("COUNT(*) FILTER (WHERE task.status = 'completed')", 'completed')
      .groupBy('task.priority')
      .getRawMany();

    // Skill → mission correlation (volunteers with skill X → how many completed missions)
    const volunteersWithTasks = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.skills', 'skills')
      .addSelect('COUNT(task.id) FILTER (WHERE task.status = \'completed\')', 'completedMissions')
      .leftJoin('user.tasks', 'task')
      .groupBy('user.id, user.skills')
      .getRawMany();

    const skillMissionMap: Record<string, { missions: number; volunteers: number }> = {};
    for (const row of volunteersWithTasks) {
      const skills: string[] = Array.isArray(row.skills) ? row.skills : [];
      for (const skill of skills) {
        if (!skillMissionMap[skill]) skillMissionMap[skill] = { missions: 0, volunteers: 0 };
        skillMissionMap[skill].missions += Number(row.completedMissions ?? 0);
        skillMissionMap[skill].volunteers++;
      }
    }
    const skillMissionCorrelation = Object.entries(skillMissionMap)
      .map(([skill, d]) => ({
        skill,
        avgMissionsPerVolunteer: d.volunteers > 0 ? +(d.missions / d.volunteers).toFixed(2) : 0,
        totalMissions: d.missions,
        volunteers: d.volunteers,
      }))
      .sort((a, b) => b.avgMissionsPerVolunteer - a.avgMissionsPerVolunteer);

    return {
      kpis,
      tasksOverTime,
      statusBreakdown,
      activeVolunteers,
      resourceUtilization,
      skillDistribution,
      missionSuccessByRegion,
      avgMissionDuration,
      durationComparison,
      missionsByDayOfWeek,
      priorityBreakdown,
      skillMissionCorrelation,
    };
  }
}
