import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskStatusDto {
    @ApiProperty({
        description: 'The new status for the task',
        enum: [TaskStatus.COMPLETED, TaskStatus.CANCELLED], // Only allow these two values
        example: TaskStatus.COMPLETED,
    })
    @IsEnum([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
    @IsNotEmpty()
    status: TaskStatus.COMPLETED | TaskStatus.CANCELLED;
}
