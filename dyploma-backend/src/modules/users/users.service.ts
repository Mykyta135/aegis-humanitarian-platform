// backend/src/modules/users/users.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFilterDto } from '../tasks/tasks.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Task } from '../tasks/entities/task.entity'; // <-- Import Task entity

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Task) // <-- Inject the Task repository
    private readonly tasksRepository: Repository<Task>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  // --- NEW SERVICE METHOD ---
  async findTasksForUser(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignee: { id: userId } },
      order: { createdAt: 'DESC' }, // Show the most recent tasks first
    });
  }
  // --------------------------

  async findAll(filters: UserFilterDto): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters.name) {
      // Use ILIKE for case-insensitive partial matching
      query.andWhere('user.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.experienceLevel) {
      query.andWhere('user.experienceLevel = :experienceLevel', {
        experienceLevel: filters.experienceLevel,
      });
    }

    if (filters.homeBase) {
      query.andWhere('user.homeBase = :homeBase', {
        homeBase: filters.homeBase,
      });
    }

    if (filters.skill) {
      query.andWhere('user.skills @> ARRAY[:skill]', { skill: filters.skill });
    }

    return query.getMany();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    this.logger.debug(
      `[findOneByEmail] Executing query to find user by email: ${email}`,
    );
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (user) {
      this.logger.debug(`[findOneByEmail] Query returned user: ${user.id}`);
    } else {
      this.logger.debug(`[findOneByEmail] Query returned no user.`);
    }
    return user;
  }
}
