import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VolunteerRequestsService } from './volunteer-requests.service';

@ApiBearerAuth()
@ApiTags('Volunteer Requests')
@Controller('volunteer-requests')
@UseGuards(JwtAuthGuard)
export class VolunteerRequestsController {
  constructor(private readonly svc: VolunteerRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a volunteer request for a task' })
  create(@Body() body: { taskId: string; requesterId: string; targetId: string; message?: string }) {
    return this.svc.create(body.taskId, body.requesterId, body.targetId, body.message);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List all requests for a task' })
  forTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.svc.findForTask(taskId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List pending requests sent to a volunteer' })
  forUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.svc.findForUser(userId);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or reject a volunteer request' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { accept: boolean },
    @Req() req: any,
  ) {
    return this.svc.respond(id, req.user.id, body.accept);
  }
}
