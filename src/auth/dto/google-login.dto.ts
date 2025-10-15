// google-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from client', example: 'eyJhbGciOiJI...' })
  @IsString()
  idToken: string;
}
