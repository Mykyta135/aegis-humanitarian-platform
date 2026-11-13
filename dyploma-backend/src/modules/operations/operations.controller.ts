import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthedRequest, assertSelfOrAdmin } from '../auth/access';
import { OperationsService } from './operations.service';

class LocationUpdateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

@ApiTags('Operations (Live)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  /**
   * A volunteer reports their own position; an admin may report anyone's.
   * Coordinates are personal data, so they are not logged.
   */
  @Post('location/:userId')
  updateLocation(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() locationUpdateDto: LocationUpdateDto,
    @Req() req: AuthedRequest,
  ) {
    assertSelfOrAdmin(req, userId);
    this.operationsService.handleLocationUpdate(
      userId,
      locationUpdateDto.lat,
      locationUpdateDto.lng,
    );
    return { message: 'Location update received and broadcasted' };
  }
}
