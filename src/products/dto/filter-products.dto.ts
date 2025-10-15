import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProductsDto {
  @ApiPropertyOptional({ description: 'Filter by category name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by main category' })
  @IsOptional()
  @IsString()
  main_category?: string;

  @ApiPropertyOptional({ description: 'Filter by sub category' })
  @IsOptional()
  @IsString()
  sub_category?: string;

  @ApiPropertyOptional({ description: 'Filter by brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple colors (comma-separated or array)',
    example: ['Red', 'Blue', 'Black'],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  color?: string[];

  @ApiPropertyOptional({ description: 'Minimum price filter', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum average rating (1–5)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rating?: number;

  @ApiPropertyOptional({ description: 'Search by product name (partial match)', example: 'T-shirt' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Sort products (default: newest)',
    example: 'price_asc',
    enum: ['price_asc', 'price_desc', 'rating_desc', 'newest'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['price_asc', 'price_desc', 'rating_desc', 'newest'])
  sort?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Page number (starts from 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;
}
