// src/orders/dto/return-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReturnOrderDto {
  @ApiProperty({ example: 'order-id-123' })
  orderId!: string;

  @ApiProperty({ example: 'Product damaged' })
  reason!: string;
}

