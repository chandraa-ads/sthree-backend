import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VariantDto } from './variant.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Gold Chain' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Jewelry' })
  @IsOptional()
  @IsString()
  main_category?: string;

  @ApiPropertyOptional({ example: 'Gold Chain' })
  @IsOptional()
  @IsString()
  sub_category?: string;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @IsNumber()
  original_price?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  discount_percentage?: number;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  product_size?: string;

  @ApiPropertyOptional({ example: 'BrandX' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Product image file (optional)',
  })
  @IsOptional()
  image?: any;

  @ApiPropertyOptional({
    type: [VariantDto],
    description: 'Variants for product',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @ApiPropertyOptional({ description: 'Description of the product' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags for the product' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Discount start date',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  discount_start_date?: string;

  @ApiPropertyOptional({
    description: 'Discount end date',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  discount_end_date?: string;
}
