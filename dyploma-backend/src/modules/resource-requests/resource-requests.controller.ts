import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResourceRequestsService } from './resource-requests.service';

@ApiBearerAuth()
@ApiTags('Resource Requests')
@Controller('resource-requests')
@UseGuards(JwtAuthGuard)
export class ResourceRequestsController {
  constructor(private readonly svc: ResourceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Request use of a resource for a task' })
  create(
    @Body() body: { taskId: string; resourceId: string; message?: string },
    @Req() req: any,
  ) {
    return this.svc.create(body.taskId, body.resourceId, req.user?.id, body.message);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List all resource requests for a task' })
  forTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.svc.findForTask(taskId);
  }

  @Get('resource/:resourceId')
  @ApiOperation({ summary: 'List pending requests for a specific resource' })
  forResource(@Param('resourceId', ParseUUIDPipe) resourceId: string) {
    return this.svc.findForResource(resourceId);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Approve or reject a resource request (admin)' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { approve: boolean },
    @Req() req: any,
  ) {
    return this.svc.respond(id, req.user?.id, body.approve);
  }
}
