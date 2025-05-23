import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can override handleRequest if you need custom error handling
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on error or user status
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
