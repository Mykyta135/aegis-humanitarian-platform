import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, ResourceCondition } from '../entities/resource.entity';

// 1. Create a specific DTO for the nested coordinates object
class CoordinatesDto {
  @ApiProperty({ example: 50.45 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 30.52 })
  @IsNumber()
  lng: number;
}

export class CreateResourceDto {
  @ApiProperty({ example: 'Ford Transit Van' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.VEHICLE })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  // --- THIS IS THE FIX ---
  @ApiProperty({ type: CoordinatesDto, example: { lat: 50.45, lng: 30.52 } })
  @ValidateNested() // Tells class-validator to validate the nested object
  @Type(() => CoordinatesDto) // Tells class-transformer to create an instance of CoordinatesDto
  @IsObject()
  location: CoordinatesDto;
  // -----------------------

  @ApiProperty({
    enum: ResourceCondition,
    example: ResourceCondition.GOOD,
    required: false,
  })
  @IsEnum(ResourceCondition)
  @IsOptional()
  condition?: ResourceCondition;

  @ApiProperty({
    example: { capacity_kg: 2000, fuelType: 'diesel' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiProperty({
    example: { last_service_date: '2025-09-01' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  maintenanceSchedule?: Record<string, any>;
}
