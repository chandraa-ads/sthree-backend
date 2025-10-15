// src/products/dto/create-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsUUID()
  product_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'The text review of the product' })
  @IsString()
  @IsNotEmpty()
  comment: string; // changed

  @ApiProperty({
    description: 'Array of review images',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsArray()
  @IsOptional()
  images?: any[];
}
