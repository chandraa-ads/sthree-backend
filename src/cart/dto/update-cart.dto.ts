import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartDto {
  @ApiPropertyOptional({ description: 'New quantity', example: 2 })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Change to this variant ID',
    example: 'uuid-of-variant',
  })
  product_variant_id?: string;

  @ApiPropertyOptional({
    description: 'User ID making the update',
    example: 'uuid-of-user',
  })
  user_id?: string;

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

  @ApiPropertyOptional({ description: 'Updated price', example: 2000 })
  price?: number;

  @ApiPropertyOptional({ description: 'Updated name', example: 'cord set 2 pair' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated image URL',
    example: 'https://example.com/image.jpg',
  })
  image_url?: string;
}
