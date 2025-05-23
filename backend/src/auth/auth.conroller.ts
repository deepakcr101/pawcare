import { Body, Controller, Post, ValidationPipe, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common'; // Import UseGuards, Get, Request
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Import JwtAuthGuard

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ... (register endpoint)

  // ... (login endpoint)

  @UseGuards(JwtAuthGuard) // Protects this route with the JWT authentication guard
  @Get('profile') // Defines a GET endpoint at /auth/profile
  getProfile(@Request() req: any) {
    // If the request reaches here, the JWT was valid, and req.user contains the decoded payload
    return req.user; // Will return { userId, email, role }
  }
}
