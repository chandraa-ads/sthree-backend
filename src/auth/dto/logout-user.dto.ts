import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutUserDto {
  @ApiPropertyOptional({ description: 'User ID (fallback if JWT not present)' })
  @IsOptional()
  @IsUUID()
  id?: string;
}
