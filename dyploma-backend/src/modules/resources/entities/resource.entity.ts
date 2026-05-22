import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Coordinates } from '../../tasks/entities/task.entity'; // Import Coordinates type

export enum ResourceType {
  VEHICLE = 'vehicle',
  GENERATOR = 'generator',
  DRONE = 'drone',
  MEDICAL_KIT = 'medical_kit',
}

export enum ResourceStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
}

export enum ResourceCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  NEEDS_MAINTENANCE = 'needs_maintenance',
  INOPERABLE = 'inoperable',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ type: 'jsonb', nullable: true })
  location: Coordinates;

  @Column({
    type: 'enum',
    enum: ResourceStatus,
    default: ResourceStatus.AVAILABLE,
  })
  status: ResourceStatus;

  @Column({
    type: 'enum',
    enum: ResourceCondition,
    default: ResourceCondition.GOOD,
  })
  condition: ResourceCondition;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  maintenanceSchedule: Record<string, any>;
}
