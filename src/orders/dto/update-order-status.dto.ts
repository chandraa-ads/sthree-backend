import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'Shipped', description: 'New status of the order' })
  status: string;
}
