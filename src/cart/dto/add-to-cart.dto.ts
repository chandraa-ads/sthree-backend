import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-of-user' })
  user_id: string;

  @ApiProperty({ example: 'uuid-of-product' })
  product_id: string;

  @ApiProperty({ example: 2, description: 'Quantity of product' })
  quantity: number;

  @ApiProperty({ example: 'M', description: 'Selected size of product' })
  selected_size: string; // ✅ new field
}
