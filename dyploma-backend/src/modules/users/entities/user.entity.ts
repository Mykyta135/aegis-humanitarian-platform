import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Logger } from '@nestjs/common';
export interface Coordinates {
  lat: number;
  lng: number;
}
export enum UserStatus {
  AVAILABLE = 'available',
  ON_MISSION = 'on_mission',
  UNAVAILABLE = 'unavailable',
}

export enum UserRole {
  ADMIN = 'admin',
  VOLUNTEER = 'volunteer',
}
// --- ADD NEW ENUM FOR EXPERIENCE ---
export enum ExperienceLevel {
  TRAINEE = 'trainee',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  EXPERT = 'expert',
}
// ------------------------------------

@Entity('users')
export class User {
  private readonly logger = new Logger(User.name);

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Hide by default
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VOLUNTEER })
  role: UserRole;

  @Column()
  name: string;

  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  homeBase: Coordinates; // Was previously a string

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    default: ExperienceLevel.JUNIOR,
  })
  experienceLevel: ExperienceLevel;

  @Column('simple-array', { default: '' })
  languages: string[]; // e.g., ['ukrainian', 'english']

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  notes: string; // Free-text notes from coordinators

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.AVAILABLE,
  })
  status: UserStatus;

  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];

  // Also on update: a password changed through PATCH must not be stored in plain text.
  // The column is select:false, so on update it is only set when the caller sends a new one;
  // an existing bcrypt hash is never hashed twice.
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) {
      return;
    }
    if (/^\$2[aby]\$\d{2}\$/.test(this.password)) {
      return;
    }
    this.logger.log(`[UserEntity] Hashing password for user: ${this.email}`);
    this.password = await bcrypt.hash(this.password, 10);
  }
}
