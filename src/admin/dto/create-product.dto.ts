import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'T-Shirt' })
  name: string;

  @ApiProperty({ example: 499 })
  price: number;

  @ApiProperty({ example: 20 })
  stock: number;

  @ApiProperty({ example: 'Clothing' })
  category: string;

  // ✅ This makes Swagger show a file input
  @ApiProperty({ type: 'string', format: 'binary', description: 'Product image file' })
  image: any;
}
