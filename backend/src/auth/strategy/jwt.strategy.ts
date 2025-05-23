import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // To access JWT_SECRET
import { PrismaService } from '../../prisma/prisma.service'; // To validate user exists if needed (optional for simple JWT)

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService, // Inject PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // How JWT is extracted from request
      ignoreExpiration: false, // Do not ignore token expiration
      secretOrKey: configService.get<string>('JWT_SECRET'), // The secret key for signing/verifying
    });
  }

  // This method is called after the JWT is validated (signature and expiration)
  // The payload contains the decoded JWT data.
  async validate(payload: any) {
    // In a real application, you might want to fetch the user from the DB
    // to ensure they still exist and are active.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return the payload data that will be attached to req.user
    // It's good practice to return a subset of user data, not the whole user object
    // especially sensitive fields like passwordHash.
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
