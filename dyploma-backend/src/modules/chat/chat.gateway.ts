import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  authenticateSocket,
  getSocketUser,
  setSocketUser,
  wsCorsOrigin,
} from '../auth/ws-auth';

const MAX_MESSAGE_LENGTH = 2000;

@WebSocketGateway({ cors: { origin: wsCorsOrigin } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const user = authenticateSocket(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    setSocketUser(client, user);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!getSocketUser(client) || typeof taskId !== 'string') return;
    void client.join(taskId);
    this.logger.log(`Client ${client.id} joined room: ${taskId}`);
  }

  /**
   * The sender is the authenticated socket user — a `senderId` sent by the
   * client is ignored, so nobody can post as someone else.
   */
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    payload: {
      taskId: string;
      content: string;
      replyToId?: string | null;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = getSocketUser(client);
    if (!user) return;
    const content =
      typeof payload?.content === 'string' ? payload.content.trim() : '';
    if (!payload?.taskId || !content || content.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    const message = await this.chatService.createMessage({
      taskId: payload.taskId,
      content,
      senderId: user.id,
      replyToId: payload.replyToId,
    });
    // Emit only to the room so sender also receives exactly one copy
    this.server.to(payload.taskId).emit('newMessage', message);
  }
}
