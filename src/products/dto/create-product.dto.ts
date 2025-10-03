import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Gold Chain' })
  name: string;

  @ApiProperty({ example: 15000 })
  price: number;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ example: 'Jewellery' })
  main_category: string;

  @ApiProperty({ example: 'Gold Chain' })
  sub_category: string;

  @ApiProperty({ example: 'BrandName' })
  brand: string;

  @ApiProperty({ example: ['S', 'M', 'L'], description: 'Multiple available sizes' })
  product_size: string[];

  @ApiProperty({ type: 'string', format: 'binary', description: 'Product image file' })
  image: any;

  @ApiProperty({ type: Object, example: { 'Care instructions': 'Hand Wash Only', Origin: 'Made in the USA' } })
  product_detail: Record<string, string>;

  @ApiProperty({ example: 'Go for a walk around the garden...', description: 'About this item' })
  about_item: string;
}
