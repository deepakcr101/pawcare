// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { AppointmentsModule } from './appointments/appointments.module'; // <-- Only ONE of these!
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { DaycareSlotsModule } from './daycare-slots/daycare-slots.module';
import { DaycareBookingsModule } from './daycare-bookings/daycare-bookings.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    PrismaModule,
    AuthModule,
    // UsersModule, 
    PetsModule,
    AppointmentsModule, // <-- Only ONE of these in the array!
    ServicesModule, StaffModule, DaycareSlotsModule, DaycareBookingsModule, ActivityLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
