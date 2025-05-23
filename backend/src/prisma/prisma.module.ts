// backend/src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- Make this module Global
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- Export PrismaService so it's available
})
export class PrismaModule {}
