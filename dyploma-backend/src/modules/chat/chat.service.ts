import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../tasks/entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createMessage(payload: {
    taskId: string;
    content: string;
    senderId: string;
    replyToId?: string | null;
  }): Promise<Message> {
    let replyTo: Message['replyTo'] = null;

    if (payload.replyToId) {
      const parent = await this.messageRepository.findOne({
        where: { id: payload.replyToId },
        relations: ['sender'],
      });
      if (parent) {
        replyTo = {
          id: parent.id,
          content: parent.content,
          sender: { id: parent.sender.id, name: parent.sender.name },
        };
      }
    }

    const message = this.messageRepository.create({
      content: payload.content,
      sender: { id: payload.senderId } as User,
      task: { id: payload.taskId } as Task,
      replyTo,
    });

    return this.messageRepository.save(message);
  }

  async findMessagesForTask(taskId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }
}
