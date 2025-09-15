import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../user/user.entity';

@Entity('chat_messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  roomId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Room, room => room.messages)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
