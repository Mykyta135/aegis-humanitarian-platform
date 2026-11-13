import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
  ParseUUIDPipe, // <-- Import ParseUUIDPipe
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserFilterDto } from '../tasks/tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoggingGuard } from '../auth/logging.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { OperationsGateway } from '../operations/operations.gateway';
import { randomUUID } from 'crypto';

type AuthedRequest = { user: { id: string; role: UserRole } };

/** Volunteers may read only their own profile and history; admins may read anyone's. */
export function assertSelfOrAdmin(req: AuthedRequest, id: string): void {
  if (req.user?.role === UserRole.ADMIN || req.user?.id === id) return;
  throw new ForbiddenException('You can only access your own profile');
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, LoggingGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gateway: OperationsGateway,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Create a new volunteer' })
  @ApiResponse({
    status: 201,
    description: 'The volunteer has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    this.gateway.sendNotification({
      id: randomUUID(),
      type: 'volunteer_added',
      title: 'New Volunteer Registered',
      message: `${user.name} has been onboarded`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      meta: { userId: user.id },
    });
    return user;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a list of all volunteers' })
  @ApiResponse({ status: 200, description: 'List of all volunteers.' })
  findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single volunteer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The volunteer has been successfully retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Not your profile and not an admin.',
  })
  @ApiResponse({ status: 404, description: 'Volunteer not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthedRequest) {
    assertSelfOrAdmin(req, id);
    return this.usersService.findOne(id);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: "Get a volunteer's mission history" })
  @ApiResponse({ status: 200, description: 'List of assigned tasks.' })
  @ApiResponse({
    status: 403,
    description: 'Not your profile and not an admin.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findTasksForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthedRequest,
  ) {
    assertSelfOrAdmin(req, id);
    return this.usersService.findTasksForUser(id);
  }

  // Role, status and other volunteers' records are managed by admins only:
  // a volunteer must not be able to promote themselves or edit/delete others.
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a volunteer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The volunteer has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Volunteer not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string, // <-- Use ParseUUIDPipe
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a volunteer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The volunteer has been successfully removed.',
  })
  @ApiResponse({ status: 404, description: 'Volunteer not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
