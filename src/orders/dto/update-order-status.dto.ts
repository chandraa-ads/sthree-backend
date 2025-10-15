// src/orders/dto/update-order-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'Shipped', description: 'New status of the order' })
  status!: string;
}
