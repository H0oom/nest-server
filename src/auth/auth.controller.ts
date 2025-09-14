import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body(ValidationPipe) signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body(ValidationPipe) signinDto: SigninDto): Promise<AuthResponseDto> {
    return this.authService.signin(signinDto);
  }
}
