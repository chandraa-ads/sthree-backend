import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
  IsDateString,
  Min,
  Max, // ✅ Add this import
} from 'class-validator';
import { Type } from 'class-transformer';

/** Variant DTO for creating/updating variants */
export class VariantDto {
  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Brown' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: ['M', 'L'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  size?: string[];

  @ApiPropertyOptional({ example: 2999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 3999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  original_price?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variant_images?: string[];
}


/** Variant DTO for creation with product_id required */
export class CreateVariantDto extends VariantDto {
  @ApiProperty({
    description: 'Product ID this variant belongs to',
    example: '12345-uuid',
  })
  @IsNotEmpty()
  @IsString()
  product_id: string;
}

/** Variant DTO for update with optional id */
export class UpdateVariantDto extends VariantDto {
  // No need to redeclare `id` here
}

export class CreateProductDto {
  @ApiProperty({ example: 'Leather Wallet' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 2999 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 3999 })
  @IsOptional()
  @IsNumber()
  original_price?: number;

  @ApiPropertyOptional({ example: 2499 })
  @IsOptional()
  @IsNumber()
  discount_price?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ example: 'Accessories' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Fashion' })
  @IsOptional()
  @IsString()
  main_category?: string;

  @ApiPropertyOptional({ example: 'Wallets' })
  @IsOptional()
  @IsString()
  sub_category?: string;

  @ApiPropertyOptional({ example: 'Premium Leather Co.' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Handcrafted leather wallet...' })
  @IsOptional()
  @IsString()
  about_item?: string;

  @ApiPropertyOptional({
    description: 'Product detail object',
    example: { material: 'Leather', warranty: '1 year' },
  })
  @IsOptional()
  product_detail?: Record<string, any>;

@ApiPropertyOptional({
  type: [VariantDto],
  example: [
    {
      color: 'Brown',
      size: 'M',
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


  @ApiPropertyOptional({ example: 'Premium handmade wallet' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  product_size?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2025-09-29T08:58:14.438Z' })
  @IsOptional()
  @IsDateString()
  discount_start_date?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2025-10-10T08:58:14.438Z' })
  @IsOptional()
  @IsDateString()
  discount_end_date?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['leather', 'wallet', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  tax_percentage?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Main product image files',
  })
  @IsOptional()
  @IsArray()
  images?: any[];

  // Internals
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
