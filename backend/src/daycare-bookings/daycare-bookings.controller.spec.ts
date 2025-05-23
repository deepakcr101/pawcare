import { Test, TestingModule } from '@nestjs/testing';
import { DaycareBookingsController } from './daycare-bookings.controller';

describe('DaycareBookingsController', () => {
  let controller: DaycareBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaycareBookingsController],
    }).compile();

    controller = module.get<DaycareBookingsController>(DaycareBookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
