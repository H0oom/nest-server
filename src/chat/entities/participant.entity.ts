import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../user/user.entity';

@Entity('chat_participants')
@Unique(['roomId', 'userId'])
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  roomId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Room, room => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
