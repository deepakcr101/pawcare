import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Connect to the database when the module is initialized
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Ensure the database connection is closed when the application shuts down
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  // Optional: Add a method to disconnect explicitly if needed
  // async onModuleDestroy() {
  //   await this.$disconnect();
  // }
}
