import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Resource } from '../../resources/entities/resource.entity';
import { Message } from './message.entity';
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TaskLogEntry {
  timestamp: string; // ISO string
  message: string;
  author?: string;
}
// Definition of possible task statuses
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Definition of possible mission regions
export enum MissionRegion {
  KYIV = 'kyiv',
  KHARKIV = 'kharkiv',
  DONETSK = 'donetsk',
  ZAPORIZHZHIA = 'zaporizhzhia',
  KHERSON = 'kherson',
  LUHANSK = 'luhansk',
}

// --- NEW ENUMS ---
export enum MissionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MissionDifficulty {
  ROUTINE = 'routine',
  COMPLEX = 'complex',
  HAZARDOUS = 'hazardous',
}
// -------------------

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: MissionRegion,
  })
  region: MissionRegion;

  // --- NEW RICH DATA FIELDS ---
  @Column({
    type: 'enum',
    enum: MissionPriority,
    default: MissionPriority.MEDIUM,
  })
  priority: MissionPriority;

  @Column({
    type: 'enum',
    enum: MissionDifficulty,
    default: MissionDifficulty.ROUTINE,
  })
  difficulty: MissionDifficulty;

  @Column('simple-array')
  requiredSkills: string[];

  @Column({ type: 'jsonb', default: [] })
  requiredResources: Record<string, any>[];

  @ManyToOne(() => User, (user) => user.tasks, { eager: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToMany(() => Resource, { eager: true })
  @JoinTable()
  resources: Resource[];

  @Column({ type: 'integer', nullable: true })
  estimatedDurationHours: number;

  @Column({ type: 'jsonb', nullable: true })
  startLocation: Coordinates;

  @Column({ type: 'jsonb', nullable: true })
  endLocation: Coordinates;

  @Column({ type: 'jsonb', nullable: true })
  homeBase: Coordinates;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'jsonb', default: [] })
  logs: TaskLogEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, message => message.task)
  messages: Message[];
}
