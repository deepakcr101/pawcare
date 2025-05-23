import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
//import { AppModule } from '../app.module';

@Module({
  imports: [],
  providers: [ServicesService],
  controllers: [ServicesController]
})
export class ServicesModule {}
