import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/user.entity';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { fullname, email, password } = signupDto;

    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const newUser = this.userRepository.create({
      fullname,
      email,
      password: hashedPassword,
      status: 'offline',
    });

    const savedUser = await this.userRepository.save(newUser);

    // JWT 토큰 생성
    const token = this.jwtService.sign({ 
      sub: savedUser.id, 
      email: savedUser.email 
    });

    return {
      id: savedUser.id,
      fullname: savedUser.fullname,
      email: savedUser.email,
      token,
    };
  }

  async signin(signinDto: SigninDto): Promise<AuthResponseDto> {
    const { email, password } = signinDto;

    // 사용자 찾기
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 유저입니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('잘못된 비밀번호입니다.');
    }

    // 사용자 상태를 online으로 업데이트
    await this.userRepository.update(user.id, { status: 'online' });

    // JWT 토큰 생성
    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email 
    });

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
