import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThreatZonesController } from './threat-zones.controller';
import { ThreatZonesService } from './threat-zones.service';

@Module({
  imports: [HttpModule],
  controllers: [ThreatZonesController],
  providers: [ThreatZonesService],
  exports: [ThreatZonesService],
})
export class ThreatZonesModule {}
