import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import {
  MissionRegion,
  MissionPriority,
  MissionDifficulty,
} from '../entities/task.entity';
import { Type } from 'class-transformer';

class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'The title of the task',
    example: 'Deliver medical supplies to Hospital #5',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'A detailed description of the task',
    example:
      'Pick up kits from Kyiv Warehouse and deliver to the main entrance.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The operational region for the task',
    enum: MissionRegion,
    example: MissionRegion.KHARKIV,
  })
  @IsEnum(MissionRegion)
  @IsNotEmpty()
  region: MissionRegion;

  // --- NEW DTO PROPERTIES ---
  @ApiProperty({
    enum: MissionPriority,
    example: MissionPriority.MEDIUM,
    required: false,
  })
  @IsEnum(MissionPriority)
  @IsOptional()
  priority?: MissionPriority;

  @ApiProperty({
    enum: MissionDifficulty,
    example: MissionDifficulty.ROUTINE,
    required: false,
  })
  @IsEnum(MissionDifficulty)
  @IsOptional()
  difficulty?: MissionDifficulty;

  @ApiProperty({
    example: ['medic', 'driver'],
    description: 'Skills required for this mission',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  requiredSkills: string[];

  @ApiProperty({
    example: [{ type: 'vehicle', attributes: { capacity_kg: 500 } }],
    description: 'Structured resource requirements',
    required: false,
  })
  @IsArray()
  @IsOptional()
  requiredResources?: Record<string, any>[];
  // --------------------------

  @ApiProperty({
    description: 'The ID of the user (volunteer) assigned to this task',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({
    description: 'An array of resource IDs required for this task',
    required: false,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  resourceIds?: string[];

  @ApiProperty({
    example: 8,
    description: 'Estimated mission duration in hours',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  estimatedDurationHours?: number;

  @ApiProperty({ description: 'ID of the user who created this mission', required: false })
  @IsUUID()
  @IsOptional()
  creatorId?: string;

  @ApiProperty({ type: CoordinatesDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  startLocation?: CoordinatesDto;

  @ApiProperty({ type: CoordinatesDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  endLocation?: CoordinatesDto;
}
