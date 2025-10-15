import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'User ID', example: 'uuid-of-user' })
  user_id: string;

  @ApiProperty({ description: 'Product ID', example: 'uuid-of-product' })
  product_id: string;

  @ApiPropertyOptional({
    description: 'Variant ID (if choosing a variant)',
    example: 'uuid-of-variant',
  })
  product_variant_id?: string;

  @ApiProperty({ description: 'Quantity to add', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Product name', example: 'cord set 2 pair' })
  name: string;

  @ApiProperty({ description: 'Product price', example: 2222 })
  price: number;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/image.jpg',
  })
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Selected color for the product variant',
    example: 'Green',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Selected size for the product variant',
    example: 'XS',
  })
  size?: string;
}
