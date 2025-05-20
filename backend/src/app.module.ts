import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service'; // Import PrismaService
// import { AuthModule } from './auth/auth.module'; // We will create this next
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ // Configure ConfigModule
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '../.env', // Specify the path to your .env file
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService], // Provide PrismaService
  exports: [PrismaService], // Export PrismaService to make it available outside this module (though global makes it widely available)
})
export class AppModule {}
