import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { Participant } from './entities/participant.entity';
import { User } from '../user/user.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto, ParticipantDto } from './dto/session-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createSession(createSessionDto: CreateSessionDto, currentUserId: number): Promise<SessionResponseDto> {
    const { target_user_id } = createSessionDto;

    // 대상 유저가 존재하는지 확인
    const targetUser = await this.userRepository.findOne({
      where: { id: target_user_id }
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 현재 유저 정보 가져오기
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      throw new UnauthorizedException('Current user not found');
    }

    // 기존 채팅방이 있는지 확인 (두 유저가 모두 참여한 방)
    const existingRoom = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.participants', 'p1')
      .leftJoin('room.participants', 'p2')
      .where('p1.userId = :currentUserId', { currentUserId })
      .andWhere('p2.userId = :targetUserId', { targetUserId: target_user_id })
      .andWhere('p1.leftAt IS NULL')
      .andWhere('p2.leftAt IS NULL')
      .getOne();

    if (existingRoom) {
      // 기존 방의 참여자 정보 가져오기
    const participants = await this.participantRepository.find({
      where: { roomId: existingRoom.id, leftAt: IsNull() },
      relations: ['user']
    });

      return {
        room_id: existingRoom.id,
        participants: participants.map(p => ({
          id: p.user.id,
          name: p.user.fullname
        }))
      };
    }

    // 새 채팅방 생성
    const room = this.roomRepository.create({
      name: `Chat between ${currentUser.fullname} and ${targetUser.fullname}`,
      description: `Private chat room`
    });

    const savedRoom = await this.roomRepository.save(room);

    // 참여자 추가
    const currentUserParticipant = this.participantRepository.create({
      roomId: savedRoom.id,
      userId: currentUserId,
      joinedAt: new Date()
    });

    const targetUserParticipant = this.participantRepository.create({
      roomId: savedRoom.id,
      userId: target_user_id,
      joinedAt: new Date()
    });

    await this.participantRepository.save([currentUserParticipant, targetUserParticipant]);

    return {
      room_id: savedRoom.id,
      participants: [
        { id: currentUser.id, name: currentUser.fullname },
        { id: targetUser.id, name: targetUser.fullname }
      ]
    };
  }

  async getRoomMessages(roomId: number, currentUserId: number): Promise<MessageResponseDto[]> {
    // 사용자가 해당 방에 참여하고 있는지 확인
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId: currentUserId, leftAt: IsNull() }
    });

    if (!participant) {
      throw new UnauthorizedException('You are not a participant of this room');
    }

    // 메시지 가져오기
    const messages = await this.messageRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });

    return messages.map(message => ({
      id: message.id,
      user: message.user.fullname,
      message: message.message,
      created_at: message.createdAt.toISOString()
    }));
  }

  async addMessage(roomId: number, userId: number, message: string): Promise<Message> {
    // 사용자가 해당 방에 참여하고 있는지 확인
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: IsNull() }
    });

    if (!participant) {
      throw new UnauthorizedException('You are not a participant of this room');
    }

    const newMessage = this.messageRepository.create({
      roomId,
      userId,
      message
    });

    return await this.messageRepository.save(newMessage);
  }

  async joinRoom(roomId: number, userId: number): Promise<void> {
    // 방이 존재하는지 확인
    const room = await this.roomRepository.findOne({
      where: { id: roomId }
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // 이미 참여하고 있는지 확인
    const existingParticipant = await this.participantRepository.findOne({
      where: { roomId, userId }
    });

    if (existingParticipant) {
      if (existingParticipant.leftAt) {
        // 다시 참여
        existingParticipant.leftAt = null;
        existingParticipant.joinedAt = new Date();
        await this.participantRepository.save(existingParticipant);
      }
    } else {
      // 새로 참여
      const participant = this.participantRepository.create({
        roomId,
        userId,
        joinedAt: new Date()
      });
      await this.participantRepository.save(participant);
    }
  }

  async leaveRoom(roomId: number, userId: number): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: IsNull() }
    });

    if (participant) {
      participant.leftAt = new Date();
      await this.participantRepository.save(participant);
    }
  }

  async getRoomParticipants(roomId: number): Promise<ParticipantDto[]> {
    const participants = await this.participantRepository.find({
      where: { roomId, leftAt: IsNull() },
      relations: ['user']
    });

    return participants.map(p => ({
      id: p.user.id,
      name: p.user.fullname
    }));
  }
}
