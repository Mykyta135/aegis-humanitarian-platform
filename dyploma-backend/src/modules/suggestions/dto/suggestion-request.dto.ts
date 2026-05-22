import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import {
  MissionDifficulty,
  MissionRegion,
} from '../../tasks/entities/task.entity';

export class SuggestionRequestDto {
  @ApiProperty({ enum: MissionRegion })
  @IsEnum(MissionRegion)
  @IsNotEmpty()
  region: MissionRegion;

  @ApiProperty({ enum: MissionDifficulty })
  @IsEnum(MissionDifficulty)
  @IsNotEmpty()
  difficulty: MissionDifficulty;

  @ApiProperty({ example: ['medic', 'driver'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  requiredSkills: string[];
}
