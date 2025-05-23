import { Test, TestingModule } from '@nestjs/testing';
import { DaycareSlotsController } from './daycare-slots.controller';

describe('DaycareSlotsController', () => {
  let controller: DaycareSlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaycareSlotsController],
    }).compile();

    controller = module.get<DaycareSlotsController>(DaycareSlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
