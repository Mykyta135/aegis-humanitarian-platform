import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Resource,
  ResourceCondition,
  ResourceStatus,
  ResourceType,
} from '../resources/entities/resource.entity';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import {
  MissionDifficulty,
  MissionPriority,
  MissionRegion,
  Task,
  TaskStatus,
} from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import {
  ExperienceLevel,
  User,
  UserRole,
  UserStatus,
} from '../users/entities/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly tasksService: TasksService,
  ) {}

  async seed() {
    await this.seedDatabase();
  }

  // Define bounding boxes for realistic coordinate generation
  private readonly regionBoundingBoxes = {
    [MissionRegion.KHARKIV]: {
      minLat: 48.5,
      maxLat: 50.5,
      minLng: 35.0,
      maxLng: 38.0,
    },
    [MissionRegion.DONETSK]: {
      minLat: 47.5,
      maxLat: 49.0,
      minLng: 36.5,
      maxLng: 38.5,
    },
    [MissionRegion.ZAPORIZHZHIA]: {
      minLat: 46.8,
      maxLat: 48.2,
      minLng: 34.5,
      maxLng: 37.0,
    },
    [MissionRegion.KHERSON]: {
      minLat: 46.0,
      maxLat: 47.5,
      minLng: 32.2,
      maxLng: 35.5,
    },
    [MissionRegion.LUHANSK]: {
      minLat: 48.0,
      maxLat: 50.0,
      minLng: 38.0,
      maxLng: 40.0,
    },
    [MissionRegion.KYIV]: {
      minLat: 49.8,
      maxLat: 51.0,
      minLng: 29.5,
      maxLng: 31.5,
    },
  };

  private async seedDatabase() {
    const userCount = await this.usersRepository.count();
    if (userCount > 0) {
      this.logger.log('🌱 Database already seeded. Skipping.');
      return;
    }

    this.logger.log('🌱 Starting large-scale database seed...');

    // --- 1. GENERATE USERS (VOLUNTEERS) ---
    this.logger.log('👤 Generating 100 rich volunteer profiles...');
    const usersToCreate: User[] = [];
    const allSkills = [
      'medic',
      'driver',
      'translator',
      'coordinator',
      'electrician',
      'mechanic',
      'cook',
      'engineer',
    ];
    const languages = ['english', 'ukrainian', 'polish', 'german', 'french'];
    const allRegionKeys = Object.keys(
      this.regionBoundingBoxes,
    ) as MissionRegion[];

    // ── Named test accounts with known credentials ──
    const testAccounts = [
      {
        name: 'Admin User',
        email: 'admin@aegis.local',
        password: 'password123',
        role: UserRole.ADMIN,
        skills: ['coordinator', 'logistics'],
        experienceLevel: ExperienceLevel.EXPERT,
        languages: ['english', 'ukrainian'],
        homeBase: { lat: 50.45, lng: 30.52 },
      },
      {
        name: 'Coordinator Kyiv',
        email: 'coordinator@aegis.local',
        password: 'password123',
        role: UserRole.ADMIN,
        skills: ['coordinator', 'translator'],
        experienceLevel: ExperienceLevel.SENIOR,
        languages: ['english', 'ukrainian', 'polish'],
        homeBase: { lat: 50.42, lng: 30.55 },
      },
      {
        name: 'Medic Olena',
        email: 'medic@aegis.local',
        password: 'password123',
        role: UserRole.VOLUNTEER,
        skills: ['medic', 'driver'],
        experienceLevel: ExperienceLevel.SENIOR,
        languages: ['ukrainian', 'english'],
        homeBase: { lat: 49.99, lng: 36.23 },
      },
      {
        name: 'Driver Petro',
        email: 'driver@aegis.local',
        password: 'password123',
        role: UserRole.VOLUNTEER,
        skills: ['driver', 'mechanic'],
        experienceLevel: ExperienceLevel.EXPERT,
        languages: ['ukrainian'],
        homeBase: { lat: 48.46, lng: 35.05 },
      },
      {
        name: 'Trainee Dmytro',
        email: 'trainee@aegis.local',
        password: 'password123',
        role: UserRole.VOLUNTEER,
        skills: ['cook'],
        experienceLevel: ExperienceLevel.TRAINEE,
        languages: ['ukrainian', 'english'],
        homeBase: { lat: 47.84, lng: 35.14 },
      },
      {
        name: 'Engineer Maria',
        email: 'engineer@aegis.local',
        password: 'password123',
        role: UserRole.VOLUNTEER,
        skills: ['engineer', 'electrician'],
        experienceLevel: ExperienceLevel.JUNIOR,
        languages: ['ukrainian', 'german'],
        homeBase: { lat: 46.63, lng: 32.62 },
      },
    ];

    for (const account of testAccounts) {
      usersToCreate.push(
        this.usersRepository.create({
          ...account,
          status: UserStatus.AVAILABLE,
        }),
      );
    }

    for (let i = 0; i < 94; i++) {
      const regionKey = faker.helpers.arrayElement(allRegionKeys);
      usersToCreate.push(
        this.usersRepository.create({
          name: faker.person.fullName(),
          email: faker.internet.email({ provider: 'aegis.local' }),
          password: 'password123',
          role: UserRole.VOLUNTEER,
          skills: faker.helpers.arrayElements(allSkills, { min: 1, max: 3 }),
          experienceLevel: faker.helpers.arrayElement(
            Object.values(ExperienceLevel),
          ),
          languages: faker.helpers.arrayElements(languages, { min: 1, max: 2 }),
          notes: Math.random() > 0.7 ? faker.lorem.sentence() : undefined,
          status: UserStatus.AVAILABLE,
          homeBase: {
            lat: faker.location.latitude({
              min: this.regionBoundingBoxes[regionKey].minLat,
              max: this.regionBoundingBoxes[regionKey].maxLat,
            }),
            lng: faker.location.longitude({
              min: this.regionBoundingBoxes[regionKey].minLng,
              max: this.regionBoundingBoxes[regionKey].maxLng,
            }),
          },
        }),
      );
    }
    const createdUsers = await this.usersRepository.save(usersToCreate, {
      chunk: 50,
    });
    this.logger.log(`👤 Seeded ${createdUsers.length} volunteers.`);

    // --- 2. GENERATE RESOURCES ---
    this.logger.log('📦 Generating 40 rich resource profiles...');
    const resourcesToCreate: Resource[] = [];

    for (let i = 0; i < 10; i++) {
      // Vehicles
      const regionKey = faker.helpers.arrayElement(allRegionKeys);
      resourcesToCreate.push(
        this.resourcesRepository.create({
          name: `${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
          type: ResourceType.VEHICLE,
          location: {
            lat: faker.location.latitude({
              min: this.regionBoundingBoxes[regionKey].minLat,
              max: this.regionBoundingBoxes[regionKey].maxLat,
            }),
            lng: faker.location.longitude({
              min: this.regionBoundingBoxes[regionKey].minLng,
              max: this.regionBoundingBoxes[regionKey].maxLng,
            }),
          },
          status: ResourceStatus.AVAILABLE,
          condition: faker.helpers.arrayElement(
            Object.values(ResourceCondition),
          ),
          attributes: {
            capacity_kg: faker.number.int({ min: 500, max: 5000 }),
            fuelType: 'diesel',
          },
          maintenanceSchedule: {
            last_service_date: faker.date.past({ years: 1 }),
          },
        }),
      );
    }
    for (let i = 0; i < 10; i++) {
      // Generators
      const regionKey = faker.helpers.arrayElement(allRegionKeys);
      resourcesToCreate.push(
        this.resourcesRepository.create({
          name: `Generator ${faker.number.int({ min: 5, max: 20 })}kW`,
          type: ResourceType.GENERATOR,
          location: {
            lat: faker.location.latitude({
              min: this.regionBoundingBoxes[regionKey].minLat,
              max: this.regionBoundingBoxes[regionKey].maxLat,
            }),
            lng: faker.location.longitude({
              min: this.regionBoundingBoxes[regionKey].minLng,
              max: this.regionBoundingBoxes[regionKey].maxLng,
            }),
          },
          status: ResourceStatus.AVAILABLE,
          condition: faker.helpers.arrayElement(
            Object.values(ResourceCondition),
          ),
          attributes: {
            output_kw: faker.number.int({ min: 5, max: 20 }),
            fuelType: 'gasoline',
          },
          maintenanceSchedule: {
            runtime_since_last_service: faker.number.int({ min: 10, max: 190 }),
            service_interval_hours: 200,
          },
        }),
      );
    }
    for (let i = 0; i < 5; i++) {
      // Drones
      const regionKey = faker.helpers.arrayElement(allRegionKeys);
      resourcesToCreate.push(
        this.resourcesRepository.create({
          name: `Drone ${faker.lorem.word()}-${faker.number.int({ min: 100, max: 999 })}`,
          type: ResourceType.DRONE,
          location: {
            lat: faker.location.latitude({
              min: this.regionBoundingBoxes[regionKey].minLat,
              max: this.regionBoundingBoxes[regionKey].maxLat,
            }),
            lng: faker.location.longitude({
              min: this.regionBoundingBoxes[regionKey].minLng,
              max: this.regionBoundingBoxes[regionKey].maxLng,
            }),
          },
          status: ResourceStatus.AVAILABLE,
          condition: faker.helpers.arrayElement(
            Object.values(ResourceCondition),
          ),
          attributes: {
            flight_time_min: faker.number.int({ min: 20, max: 45 }),
          },
        }),
      );
    }
    for (let i = 0; i < 15; i++) {
      // Medical Kits
      const regionKey = faker.helpers.arrayElement(allRegionKeys);
      resourcesToCreate.push(
        this.resourcesRepository.create({
          name: `Medical Kit ${faker.string.alpha(1).toUpperCase()}-${faker.number.int({ min: 1, max: 10 })}`,
          type: ResourceType.MEDICAL_KIT,
          location: {
            lat: faker.location.latitude({
              min: this.regionBoundingBoxes[regionKey].minLat,
              max: this.regionBoundingBoxes[regionKey].maxLat,
            }),
            lng: faker.location.longitude({
              min: this.regionBoundingBoxes[regionKey].minLng,
              max: this.regionBoundingBoxes[regionKey].maxLng,
            }),
          },
          status: ResourceStatus.AVAILABLE,
          condition: ResourceCondition.EXCELLENT,
          attributes: {
            level: faker.helpers.arrayElement([
              'IFAK',
              'Trauma Kit',
              'Advanced',
            ]),
          },
        }),
      );
    }
    const createdResources = await this.resourcesRepository.save(
      resourcesToCreate,
      { chunk: 50 },
    );
    this.logger.log(`📦 Seeded ${createdResources.length} resources.`);

    this.logger.log(
      '📋 Generating 150 tasks using TasksService for realistic status updates...',
    );

    // Get all users and resources that are available at the START of the seeding
    const availableVolunteers = createdUsers.filter(
      (u) => u.role === UserRole.VOLUNTEER && u.status === UserStatus.AVAILABLE,
    );
    const availableResources = createdResources.filter(
      (r) => r.status === ResourceStatus.AVAILABLE,
    );

    if (availableVolunteers.length === 0 || availableResources.length === 0) {
      this.logger.error(
        'Available users or resources not found, cannot seed tasks.',
      );
      return;
    }

    const createdTasks: Task[] = []; // Keep track of the tasks we create

    for (let i = 0; i < 150; i++) {
      // Find a volunteer who is currently available for this specific new task
      const assignee = faker.helpers.arrayElement(
        availableVolunteers.filter((u) => u.status === UserStatus.AVAILABLE),
      );
      if (!assignee) {
        this.logger.warn(
          'No available volunteers left to assign tasks. Stopping task creation.',
        );
        break; // Stop if we run out of people
      }

      const taskResources = faker.helpers.arrayElements(
        availableResources.filter((r) => r.status === ResourceStatus.AVAILABLE),
        { min: 1, max: 3 },
      );
      if (taskResources.length === 0) {
        this.logger.warn(
          'No available resources left to assign to tasks. Stopping task creation.',
        );
        break; // Stop if we run out of resources
      }

      const taskRegion = faker.helpers.arrayElement(allRegionKeys);
      const regionBox = this.regionBoundingBoxes[taskRegion];

      const taskDto: CreateTaskDto = {
        title: faker.lorem.sentence({ min: 3, max: 5 }),
        description: faker.lorem.paragraph(),
        region: taskRegion,
        priority: faker.helpers.arrayElement(Object.values(MissionPriority)),
        difficulty: faker.helpers.arrayElement(
          Object.values(MissionDifficulty),
        ),
        requiredSkills: faker.helpers.arrayElements(allSkills, {
          min: 1,
          max: 2,
        }),
        assigneeId: assignee.id,
        resourceIds: taskResources.map((r) => r.id),
        estimatedDurationHours: faker.number.int({ min: 1, max: 48 }),
        startLocation: {
          lat: faker.location.latitude({
            min: regionBox.minLat,
            max: regionBox.maxLat,
          }),
          lng: faker.location.longitude({
            min: regionBox.minLng,
            max: regionBox.maxLng,
          }),
        },
        endLocation: {
          lat: faker.location.latitude({
            min: regionBox.minLat,
            max: regionBox.maxLat,
          }),
          lng: faker.location.longitude({
            min: regionBox.minLng,
            max: regionBox.maxLng,
          }),
        },
      };

      // Use the service to create the task. This will correctly set its status to PENDING
      // and mark the assignee/resources as ON_MISSION / IN_USE.
      const createdTask = await this.tasksService.create(taskDto);
      createdTasks.push(createdTask);
    }
    this.logger.log(
      `📋 Created ${createdTasks.length} initial tasks with PENDING status.`,
    );

    // --- NEW LOGIC: UPDATE STATUSES FOR REALISM ---
    this.logger.log('📊 Simulating mission progression for analytics...');
    for (const task of createdTasks) {
      // Decide the task's final state probabilistically
      const outcome = faker.helpers.arrayElement([
        TaskStatus.IN_PROGRESS,
        TaskStatus.IN_PROGRESS, // 40% chance of being in progress
        TaskStatus.COMPLETED,
        TaskStatus.COMPLETED,
        TaskStatus.COMPLETED, // 60% chance of being completed
        TaskStatus.CANCELLED, // 20% chance of being cancelled
        null,
        null,
        null, // Some remain PENDING
      ]);

      if (outcome === TaskStatus.IN_PROGRESS) {
        // Update status to IN_PROGRESS
        await this.tasksRepository.update(task.id, {
          status: TaskStatus.IN_PROGRESS,
        });
      } else if (
        outcome === TaskStatus.COMPLETED ||
        outcome === TaskStatus.CANCELLED
      ) {
        // If completed or cancelled, we need to free up the user and resources again
        const taskWithRelations = await this.tasksRepository.findOne({
          where: { id: task.id },
          relations: ['assignee', 'resources'],
        });
        if (taskWithRelations) {
          if (taskWithRelations.assignee) {
            await this.usersRepository.update(taskWithRelations.assignee.id, {
              status: UserStatus.AVAILABLE,
            });
          }
          if (taskWithRelations.resources.length > 0) {
            await this.resourcesRepository.update(
              taskWithRelations.resources.map((r) => r.id),
              { status: ResourceStatus.AVAILABLE },
            );
          }
          // Finally, update the task status and its completion time
          await this.tasksRepository.update(task.id, {
            status: outcome,
            updatedAt: faker.date.between({
              from: task.createdAt,
              to: new Date(),
            }),
          });
        }
      }
      // If outcome is null, the task remains PENDING, and the user/resources remain busy.
    }
    // ---------------------------------------------
    this.logger.log(`✅ Large-scale database seeding complete.`);
  }
}
