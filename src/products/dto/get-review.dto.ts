// src/products/dto/get-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GetReviewDto {
  @ApiProperty({ example: 'user-uuid-123' })
  user_id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Amazing quality!' })
  comment: string;

  @ApiProperty({ example: '2025-09-22T06:00:00Z' })
  created_at: string;
}
