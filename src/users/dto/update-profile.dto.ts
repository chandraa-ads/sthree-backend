import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'user-id-123', description: 'Unique ID of the user' })
  userId: string;

  @ApiPropertyOptional({ example: 'Baby Name', description: 'Full name of the user' })
  full_name?: string;

  @ApiPropertyOptional({ example: '9876543210', description: 'Phone number of the user' })
  phone?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['123 Street, City', '456 Another St'],
    description: 'Multiple addresses, click "Add Item" to add more',
  })
  addresses?: string[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Upload profile photo only via file (binary)',
  })
  profile_photo?: any;
}
