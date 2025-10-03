import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'user-id-123', description: 'ID of the user giving the review' })
  user_id: string;

  @ApiProperty({ example: 'product-id-456', description: 'ID of the product being reviewed' })
  product_id: string;

  @ApiProperty({ example: 5, description: 'Rating from 0 to 5' })
  rating: number;

  @ApiProperty({ example: 'Amazing quality!', description: 'Optional comment from the user' })
  comment?: string;
}
