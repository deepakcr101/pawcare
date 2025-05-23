import { Test, TestingModule } from '@nestjs/testing';
import { DaycareSlotsService } from './daycare-slots.service';

describe('DaycareSlotsService', () => {
  let service: DaycareSlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaycareSlotsService],
    }).compile();

    service = module.get<DaycareSlotsService>(DaycareSlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
