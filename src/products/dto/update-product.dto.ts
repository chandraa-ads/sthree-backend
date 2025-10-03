import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Gold Chain' })
  name?: string;

  @ApiPropertyOptional({ example: 'Jewelry' })
  main_category?: string;

  @ApiPropertyOptional({ example: 'Gold Chain' })
  sub_category?: string;

  @ApiPropertyOptional({ example: 499 })
  price?: number;

  @ApiPropertyOptional({ example: 10 })
  discount?: number;

  @ApiPropertyOptional({ example: 'M' })
  product_size?: string;

  @ApiPropertyOptional({ example: 'BrandX' })
  brand?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Product image file (optional)' })
  image?: any;
}
