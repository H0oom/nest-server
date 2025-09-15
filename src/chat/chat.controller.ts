import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req: any
  ): Promise<SessionResponseDto> {
    return this.chatService.createSession(createSessionDto, req.user.id);
  }

  @Get(':room_id/messages')
  async getRoomMessages(
    @Param('room_id') roomId: number,
    @Request() req: any
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getRoomMessages(roomId, req.user.id);
  }
}
