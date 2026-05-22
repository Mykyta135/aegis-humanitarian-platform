import { Injectable, Logger } from '@nestjs/common';
import { OperationsGateway } from './operations.gateway';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(private readonly operationsGateway: OperationsGateway) {}

  handleLocationUpdate(userId: string, lat: number, lng: number) {
    this.logger.log(
      `Broadcasting location for ${userId}: { lat: ${lat}, lng: ${lng} }`,
    );
    this.operationsGateway.sendLocationUpdate({
      userId,
      location: { lat, lng },
    });
  }
}
