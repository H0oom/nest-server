import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      select: ['id', 'fullname', 'status'],
    });

    return users.map(user => ({
      id: user.id,
      name: user.fullname,
      status: user.status,
    }));
  }
}
