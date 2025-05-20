import { Body, Controller, Post, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common'; // Import HttpCode, HttpStatus
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto
import { User } from '@prisma/client';

@Controller('auth') // Base route for authentication endpoints
export class AuthController {
  constructor(private authService: AuthService) {} // Inject AuthService

  @Post('/register') // Defines a POST endpoint at /auth/register
  async register(@Body(ValidationPipe) registerUserDto: RegisterUserDto): Promise<User> {
    return this.authService.register(registerUserDto);
  }

  // We'll add login endpoint here next
  @Post('/login') // Defines a POST endpoint at /auth/login
  @HttpCode(HttpStatus.OK) // Return 200 OK on success instead of default 201
  async login(@Body(ValidationPipe) loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginUserDto);
  }
  // @Post('/login')
  // async login(@Body(ValidationPipe) loginUserDto: LoginUserDto): Promise<{ accessToken: string }> { ... }
}
