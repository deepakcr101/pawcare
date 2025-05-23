import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'; // Import UnauthorizedException
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client'; 

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // Inject JwtService
    private configService: ConfigService, // Inject ConfigService
  ) {}


  async register(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.OWNER, // <-- FIX: Assign 'OWNER' role here on the backend
        // Add any other default fields here
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Automatically log in the user after registration (optional, but common UX)
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
  // We'll add login logic here next
  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;

    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found or password doesn't match, throw UnauthorizedException
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // User is valid, generate JWT
    const payload = {
      sub: user.id, // Subject of the token, conventionally the user ID
      email: user.email,
      role: user.role, // Include user role in the token payload
    };

    // Generate the access token
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  // async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> { ... }
}
