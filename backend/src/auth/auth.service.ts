// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto'; // Assuming you have this DTO

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginUserDto) {
    console.log('AuthService: Attempting login for email:', dto.email);
    // console.log('AuthService: Password received:', dto.password); // Be careful with logging actual passwords!

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      console.log('AuthService: User not found for email:', dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('AuthService: User found:', user.email);
    // console.log('AuthService: Hashed password in DB:', user.passwordHash); // Don't log in production

    // Corrected: use user.passwordHash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('AuthService: Invalid password for user:', user.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('AuthService: Password is valid for user:', user.email);

    // If credentials are valid, generate JWT token
    // Corrected: use user.id
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: {
        // Corrected: use user.id
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone, // Include relevant user properties
        address: user.address,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      accessToken,
    };
  }

  // Ensure your register method (if present) also uses user.passwordHash for saving
  async register(dto: RegisterUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword, // Store as passwordHash
        firstName: dto.firstName,
        lastName: dto.lastName,
        //phone: dto.phone,
        //address: dto.address,
        //role: dto.role || 'CLIENT', // Default role if not provided
      },
    });

    // You might want to log the new user or return a success message
    // return { message: 'User registered successfully', user: { email: user.email, role: user.role } };
    // Or directly log them in:
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
    };
  }
}