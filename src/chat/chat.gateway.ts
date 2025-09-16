import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';
import { AuthenticateDto, JoinRoomDto, LeaveRoomDto, SendMessageDto } from './dto/websocket-events.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'http://api.h0oom.kro.kr' 
      : '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private userService: UserService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: AuthenticateDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!data.token) {
        client.emit('auth_error', { message: 'Token is required' });
        return;
      }

      const payload = this.jwtService.verify(data.token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        client.emit('auth_error', { message: 'Invalid token' });
        return;
      }

      // 소켓에 사용자 정보 저장
      client.userId = user.id;
      client.user = user;

      // 연결된 사용자 목록에 추가
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, new Set());
      }
      this.connectedUsers.get(user.id)!.add(client.id);

      client.emit('authenticated', {
        message: 'Authentication successful',
        user: {
          user_id: user.id.toString(),
          name: user.fullname,
          email: user.email,
          token: data.token,
        },
      });
    } catch (error) {
      client.emit('auth_error', { message: 'Invalid token' });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      await this.chatService.joinRoom(data.room_id, client.userId);
      
      // 해당 방에 참여
      client.join(`room_${data.room_id}`);

      client.emit('room_joined', {
        room_id: data.room_id.toString(),
        message: 'Successfully joined room',
      });

      // 다른 사용자들에게 사용자가 참여했음을 알림
      client.to(`room_${data.room_id}`).emit('user_joined', {
        user_id: client.userId.toString(),
        user_name: client.user.fullname,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      await this.chatService.leaveRoom(data.room_id, client.userId);
      
      // 해당 방에서 나가기
      client.leave(`room_${data.room_id}`);

      client.emit('room_left', {
        room_id: data.room_id.toString(),
        message: 'Left room',
      });

      // 다른 사용자들에게 사용자가 나갔음을 알림
      client.to(`room_${data.room_id}`).emit('user_left', {
        user_id: client.userId.toString(),
        user_name: client.user.fullname,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!data.message || data.message.trim() === '') {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }
      const userId = client.userId || 0;
      const userName = client.user?.fullname || 'Anonymous';

      const message = await this.chatService.addMessage(
        data.room_id,
        userId,
        data.message.trim(),
      );

      // 해당 방의 모든 사용자에게 메시지 브로드캐스트
      this.server.to(`room_${data.room_id}`).emit('new_message', {
        id: message.id.toString(),
        user_id: userId.toString(),
        user_name: userName,
        message: message.message,
        created_at: message.createdAt.toISOString(),
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}