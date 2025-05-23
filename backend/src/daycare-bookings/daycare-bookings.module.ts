import { Module } from '@nestjs/common';
import { DaycareBookingsService } from './daycare-bookings.service';
import { DaycareBookingsController } from './daycare-bookings.controller';

@Module({
  providers: [DaycareBookingsService],
  controllers: [DaycareBookingsController]
})
export class DaycareBookingsModule {}
