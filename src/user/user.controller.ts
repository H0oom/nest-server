import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.userService.getAllUsers();
  }
}
