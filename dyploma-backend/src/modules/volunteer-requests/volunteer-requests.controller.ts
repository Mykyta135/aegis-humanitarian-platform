import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthedRequest, assertSelfOrAdmin } from '../auth/access';
import { VolunteerRequestsService } from './volunteer-requests.service';

@ApiBearerAuth()
@ApiTags('Volunteer Requests')
@Controller('volunteer-requests')
@UseGuards(JwtAuthGuard)
export class VolunteerRequestsController {
  constructor(private readonly svc: VolunteerRequestsService) {}

  /** The requester is the signed-in user; a `requesterId` in the body is ignored. */
  @Post()
  @ApiOperation({ summary: 'Send a volunteer request for a task' })
  create(
    @Body() body: { taskId: string; targetId: string; message?: string },
    @Req() req: AuthedRequest,
  ) {
    return this.svc.create(
      body.taskId,
      req.user.id,
      body.targetId,
      body.message,
    );
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List all requests for a task' })
  forTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.svc.findForTask(taskId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List pending requests sent to a volunteer' })
  forUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: AuthedRequest,
  ) {
    assertSelfOrAdmin(req, userId);
    return this.svc.findForUser(userId);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or reject a volunteer request' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { accept: boolean },
    @Req() req: AuthedRequest,
  ) {
    return this.svc.respond(id, req.user.id, body.accept);
  }
}
