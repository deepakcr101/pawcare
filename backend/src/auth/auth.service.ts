import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'; // Import UnauthorizedException
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // Inject JwtService
    private configService: ConfigService, // Inject ConfigService
  ) {}


  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const { email, password, firstName, lastName, phone } = registerUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      // Hash the password
      const saltOrRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltOrRounds);

      // Create the user in the database
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: 'OWNER', // Default role for new registrations
        },
      });

      // In a real app, you might remove the passwordHash before returning the user object
      // delete user.passwordHash; // Not possible directly on Prisma result, needs transformation

      return user;

    } catch (error) {
      // Handle potential database errors
      console.error('Registration error:', error); // Log the error for debugging
      throw new InternalServerErrorException('Failed to register user');
    }
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
