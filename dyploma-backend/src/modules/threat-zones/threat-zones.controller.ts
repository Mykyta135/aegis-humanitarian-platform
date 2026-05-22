import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThreatZonesService } from './threat-zones.service';

@ApiBearerAuth()
@ApiTags('Threat Zones')
@Controller('threat-zones')
@UseGuards(JwtAuthGuard)
export class ThreatZonesController {
  constructor(private readonly threatZonesService: ThreatZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all threat zones including live air raid alerts' })
  getThreatZones() {
    return this.threatZonesService.getThreatZones();
  }
}
