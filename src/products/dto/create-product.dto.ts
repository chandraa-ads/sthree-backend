import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VariantDto } from './variant.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Leather Wallet'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 2999
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Original price before discount',
    example: 3999
  })
  @IsOptional()
  @IsNumber()
  original_price?: number;

  @ApiPropertyOptional({
    description: 'Discounted price',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  discount_percentage?: number;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Accessories'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Main category',
    example: 'Fashion'
  })
  @IsOptional()
  @IsString()
  main_category?: string;

  @ApiPropertyOptional({
    description: 'Sub category',
    example: 'Wallets'
  })
  @IsOptional()
  @IsString()
  sub_category?: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Premium Leather Co.'
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'About item description',
    example: 'Handcrafted leather wallet with RFID protection.'
  })
  @IsOptional()
  @IsString()
  about_item?: string;

  @ApiPropertyOptional({
    description: 'Product details JSON object',
    example: { material: "Leather", warranty: "1 year" }
  })
  @IsOptional()
  product_detail?: Record<string, any>;
@ApiPropertyOptional({
  type: [VariantDto],
  example: [
    {
      color: 'Brown',
      size: ['M', 'L'],
      price: 2999,
      stock: 20,
      original_price: 3999,
      discount_percentage: 25,
      variant_images: [],
    },
  ],
})
@IsOptional()
@ValidateNested({ each: true })
@Type(() => VariantDto)
variants?: VariantDto[];


  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Premium handmade leather wallet with multiple compartments.'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product size',
    example: 'Medium'
  })
  @IsOptional()
  @IsString()
  product_size?: string;

  @ApiPropertyOptional({
    description: 'Discount start date',
    format: 'date-time',
    example: '2025-09-29T08:58:14.438Z'
  })
  @IsOptional()
  @IsDateString()
  discount_start_date?: string;

  @ApiPropertyOptional({
    description: 'Discount end date',
    format: 'date-time',
    example: '2025-10-10T08:58:14.438Z'
  })
  @IsOptional()
  @IsDateString()
  discount_end_date?: string;

  @ApiPropertyOptional({
    description: 'Tags for the product',
    type: [String],
    example: ['leather', 'wallet', 'fashion', 'premium']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | string;




  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax percentage',
    example: 18
  })


  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Main product image files',
    example: []
  })
  @IsOptional()
  @IsArray()
  images?: any[];

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  updated_by?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsDateString()
  published_at?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsDateString()
  archived_at?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  sku?: string;
}


