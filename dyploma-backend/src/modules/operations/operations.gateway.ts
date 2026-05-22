import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class OperationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OperationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client CONNECTED: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client DISCONNECTED: ${client.id}`);
  }

  sendLocationUpdate(payload: {
    userId: string;
    location: { lat: number; lng: number };
    taskId?: string;
  }) {
    this.server.emit('locationUpdate', payload);
  }

  sendSimulationComplete(payload: {
    taskId: string;
    volunteerId: string;
    volunteerName: string;
  }) {
    this.logger.log(`📢 Broadcasting simulationComplete: task=${payload.taskId}`);
    this.server.emit('simulationComplete', payload);
  }

  sendNotification(payload: {
    id: string;
    type: 'task_created' | 'task_completed' | 'task_cancelled' | 'volunteer_added' | 'resource_added' | 'status_change' | 'alert';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'success' | 'error';
    timestamp: string;
    meta?: Record<string, any>;
  }) {
    this.server.emit('notification', payload);
  }
}
