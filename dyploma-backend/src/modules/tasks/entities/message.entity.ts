import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from './task.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => Task, (task) => task.messages)
  task: Task;

  /** Self-referencing reply: stores the replied-to message inline as JSON */
  @Column({ type: 'jsonb', nullable: true, default: null })
  replyTo: {
    id: string;
    content: string;
    sender: { id: string; name: string };
  } | null;

  @CreateDateColumn()
  createdAt: Date;
}
