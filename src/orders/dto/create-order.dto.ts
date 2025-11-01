import { ApiProperty } from '@nestjs/swagger';

// ShippingAddress DTO
export class ShippingAddressDto {
  @ApiProperty({ example: '123 Street' })
  line1!: string;

  @ApiProperty({ example: 'Bangalore' })
  city!: string;

  @ApiProperty({ example: '560001' })
  pincode!: string;
}

// CartItem DTO
export class CartItemDto {
  @ApiProperty({
    example: 'caf070b5-d07c-4748-aa7e-0144a83abc1a',
    description: 'Product ID',
  })
  product_id!: string;

  @ApiProperty({
    example: 'b5911436-f121-43d3-845d-4b9b52f15146',
    description: 'Variant product ID',
    required: false,
  })
  product_variant_id?: string;

  @ApiProperty({ example: 'M', required: false })
  selected_size?: string;

  @ApiProperty({ example: 'Brown', required: false })
  selected_color?: string;

  @ApiProperty({ example: 2999 })
  price!: number;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 'Leather Wallet' })
  product_name!: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Upload product image file (optional)',
  })
  image_file?: any;


  @ApiProperty({
    example: 'https://yourcdn.com/images/wallet.png',
    required: false,
    description: 'If already hosted, use this instead of file upload',
  })
  image_url?: string | null;
}

// CreateOrder DTO
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
