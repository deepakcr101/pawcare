// backend/src/pets/pets.module.ts
import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for JwtAuthGuard etc.

@Module({
  imports: [
    AuthModule, // Import AuthModule so PetsController can use JwtAuthGuard
  ],
  controllers: [PetsController],
  providers: [
    PetsService,
    PrismaService, // <--- ADD PrismaService to the providers array of PetsModule
  ],
  exports: [PetsService], // Optional: export PetsService if other modules will need it
})
export class PetsModule {}
