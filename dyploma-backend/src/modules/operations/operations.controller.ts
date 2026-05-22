import { Body, Controller, Logger, Param, Post } from '@nestjs/common'; // Import Logger
import { ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';

// It's good practice to use class-validator for DTOs
import { IsNumber } from 'class-validator';

class LocationUpdateDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

@ApiTags('Operations (Live)')
@Controller('operations')
export class OperationsController {
  private readonly logger = new Logger(OperationsController.name); // Add logger for debugging

  constructor(private readonly operationsService: OperationsService) {}

  @Post('location/:userId')
  updateLocation(
    @Param('userId') userId: string,
    @Body() locationUpdateDto: LocationUpdateDto, // NestJS will validate this DTO
  ) {
    // --- THIS IS THE FIX ---
    this.logger.log(`Received location update for userId: ${userId}`);
    this.logger.debug(
      `Request Body (DTO): ${JSON.stringify(locationUpdateDto)}`,
    );

    // The locationUpdateDto object itself contains lat and lng.
    // We were not passing them correctly to the service.
    this.operationsService.handleLocationUpdate(
      userId,
      locationUpdateDto.lat, // Pass the 'lat' property
      locationUpdateDto.lng, // Pass the 'lng' property
    );
    // -----------------------

    return { message: 'Location update received and broadcasted' };
  }
}
