import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import {
  Resource,
  ResourceCondition,
  ResourceType,
} from './entities/resource.entity';
export class ResourceFilterDto {
  type?: ResourceType;
  condition?: ResourceCondition;
  location?: string;
  name?: string; // <-- Add name
}

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
  ) {}

  create(createResourceDto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourcesRepository.create(createResourceDto);
    return this.resourcesRepository.save(resource);
  }

  async findAll(filters: ResourceFilterDto): Promise<Resource[]> {
    const query = this.resourcesRepository.createQueryBuilder('resource');

    if (filters.name) {
      // Use ILIKE for case-insensitive partial matching
      query.andWhere('resource.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.type) {
      query.andWhere('resource.type = :type', { type: filters.type });
    }

    if (filters.condition) {
      query.andWhere('resource.condition = :condition', {
        condition: filters.condition,
      });
    }

    if (filters.location) {
      query.andWhere('resource.location = :location', {
        location: filters.location,
      });
    }

    return query.getMany();
  }
  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourcesRepository.findOneBy({ id });
    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }
    return resource;
  }

  async update(
    id: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.resourcesRepository.preload({
      id: id,
      ...updateResourceDto,
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }
    return this.resourcesRepository.save(resource);
  }

  async remove(id: string): Promise<void> {
    const result = await this.resourcesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }
  }
}
