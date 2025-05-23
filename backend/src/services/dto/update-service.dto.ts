// backend/src/services/dto/update-service.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto'; // Import CreateServiceDto

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  // All properties from CreateServiceDto are inherited and made optional
  // You can add specific validation rules here if needed, or override existing ones.
}
