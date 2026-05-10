import { Controller, Post, Body } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class UserAuthController {
  constructor(private userAuthService: UserAuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.userAuthService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.userAuthService.login(dto);
  }
}
