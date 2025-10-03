// src/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';

// ✅ First declare ShippingAddressDto
export class ShippingAddressDto {
  @ApiProperty({ example: '123 Street' })
  line1!: string;

  @ApiProperty({ example: 'Bangalore' })
  city!: string;

  @ApiProperty({ example: '560001' })
  pincode!: string;
}

// ✅ Next declare CartItemDto
export class CartItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  product_id!: string;

  @ApiProperty({ example: 'M', required: false })
  selected_size?: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 10000 })
  price!: number;

  @ApiProperty({ example: 'Mysore Silk Saree' })
  product_name!: string;
}

// ✅ Finally declare CreateOrderDto
export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-user' })
  user_id!: string;

  @ApiProperty({ example: 'COD', description: 'Payment method' })
  payment_method!: string;

  @ApiProperty({ type: ShippingAddressDto })
  shipping_address!: ShippingAddressDto;

  @ApiProperty({ type: () => [CartItemDto] })
  items!: CartItemDto[];
}
