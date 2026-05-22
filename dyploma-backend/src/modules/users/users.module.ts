import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { Task } from '../tasks/entities/task.entity';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task]),
    forwardRef(() => AuthModule), // Use forwardRef
    OperationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
