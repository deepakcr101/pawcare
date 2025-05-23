// backend/src/daycare-slots/daycare-slots.module.ts

import { Module } from '@nestjs/common';
import { DaycareSessionsService } from './daycare-sessions.service'; // CHANGE: Import the new service name
import { DaycareSessionsController } from './daycare-sessions.controller'; // CHANGE: Import the new controller name

@Module({
  providers: [DaycareSessionsService], // CHANGE: Use the new service class name
  controllers: [DaycareSessionsController], // CHANGE: Use the new controller class name
  exports: [DaycareSessionsService] // It's good practice to export the service if other modules might need it
})
export class DaycareSlotsModule {}