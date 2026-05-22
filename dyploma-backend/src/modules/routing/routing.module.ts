import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutingService } from './routing.service';

@Module({
  imports: [HttpModule], // Import HttpModule for making API calls
  providers: [RoutingService],
  exports: [RoutingService], // Export the service
})
export class RoutingModule {}
