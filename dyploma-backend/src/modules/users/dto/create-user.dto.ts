import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { UserStatus, ExperienceLevel, UserRole } from '../entities/user.entity'; // Import ExperienceLevel

export interface Coordinates {
  lat: number;
  lng: number;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: ['medic', 'translator'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({ example: 'Available for immediate deployment' })
  @IsString()
  @IsOptional()
  availabilityNotes?: string;

  @ApiProperty({ example: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    enum: ExperienceLevel,
    example: ExperienceLevel.SENIOR,
    required: false,
  })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @ApiProperty({ example: ['english', 'polish'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiProperty({ example: '+380501234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Experienced in high-stress environments.',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    enum: UserStatus,
    default: UserStatus.AVAILABLE,
    required: false,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ example: { lat: 50.4501, lng: 30.5234 }, required: false })
  @IsOptional()
  homeBase?: Coordinates;
}
