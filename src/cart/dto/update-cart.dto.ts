import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartDto {
  @ApiPropertyOptional({ example: 3, description: 'Updated quantity of product' })
  quantity?: number;

  @ApiPropertyOptional({ example: 'M', description: 'Updated selected size of product' })
  selected_size?: string; // ✅ Add this field
}
