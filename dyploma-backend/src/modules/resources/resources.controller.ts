import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceFilterDto, ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OperationsGateway } from '../operations/operations.gateway';
import { randomUUID } from 'crypto';

// Everyone signed in can see the inventory; only admins change it.
@ApiBearerAuth()
@ApiTags('Resources')
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly gateway: OperationsGateway,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 201,
    description: 'The resource has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createResourceDto: CreateResourceDto) {
    const resource = await this.resourcesService.create(createResourceDto);
    this.gateway.sendNotification({
      id: randomUUID(),
      type: 'resource_added',
      title: 'New Resource Added',
      message: `${resource.name} (${resource.type}) has been registered`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      meta: { resourceId: resource.id },
    });
    return resource;
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of resources retrieved successfully.',
  })
  findAll(@Query() filters: ResourceFilterDto) {
    // Use the @Query() decorator
    return this.resourcesService.findAll(filters);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Resource retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Use string UUID
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Resource updated successfully.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Resource deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.remove(id);
  }
}
