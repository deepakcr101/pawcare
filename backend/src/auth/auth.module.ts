import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { PassportModule } from '@nestjs/passport'; // Import PassportModule
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { JwtStrategy } from './strategy/jwt.strategy'; 

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Configure PassportModule
    JwtModule.registerAsync({ // Configure JwtModule asynchronously
     // imports: [ConfigService], // Import ConfigService to use it here
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get secret from environment variables
        signOptions: { expiresIn: '60m' }, // Set token expiration time (e.g., 60 minutes)
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    // UsersModule, // If User service/repository were in a separate module, import here
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy], // Keep PrismaService here for Auth logic
  exports: [AuthService, JwtModule, PassportModule], // Export Auth-related providers and modules
})
export class AuthModule {}
