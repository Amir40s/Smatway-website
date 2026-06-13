import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private userSockets = new Map<string, string>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries()).find(
      ([_, id]) => id === client.id,
    )?.[0];
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    client: Socket,
    payload: { chatId: string; content: string; userId: string },
  ) {
    try {
      const senderId =
        (client.handshake.query.userId as string) || payload.userId;
      const message = await this.chatService.sendMessage(
        payload.chatId,
        senderId,
        payload.content,
      );
      const chat = await this.chatService.getChatById(payload.chatId);

      this.server.to(`chat:${payload.chatId}`).emit('message', message);
      if (chat) {
        const receiverId =
          senderId === chat.travelerId ? chat.transporterId : chat.travelerId;
        this.server.to(`user:${receiverId}`).emit('notification', {
          type: 'message',
          message,
          bookingId: chat.bookingId,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      client.emit('error', { message: errorMessage });
    }
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(client: Socket, payload: { chatId: string }) {
    client.join(`chat:${payload.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(client: Socket, payload: { chatId: string }) {
    client.leave(`chat:${payload.chatId}`);
  }

  notifyUser(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('notification', data);
  }

  sendMessage(chatId: string, message: any) {
    this.server.to(`chat:${chatId}`).emit('message', message);
  }
}
