import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(taskId);
    this.logger.log(`Client ${client.id} joined room: ${taskId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    payload: {
      taskId: string;
      content: string;
      senderId: string;
      replyToId?: string | null;
    },
  ): Promise<void> {
    this.logger.log(`Message received for room ${payload.taskId}: ${payload.content}`);
    const message = await this.chatService.createMessage({
      taskId: payload.taskId,
      content: payload.content,
      senderId: payload.senderId,
      replyToId: payload.replyToId,
    });
    // Emit only to the room so sender also receives exactly one copy
    this.server.to(payload.taskId).emit('newMessage', message);
  }
}
