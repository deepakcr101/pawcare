import { Test, TestingModule } from '@nestjs/testing';
import { DaycareBookingsService } from './daycare-bookings.service';

describe('DaycareBookingsService', () => {
  let service: DaycareBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaycareBookingsService],
    }).compile();

    service = module.get<DaycareBookingsService>(DaycareBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
