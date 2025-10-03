// google-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from client', example: 'eyJhbGciOiJI...' })
  idToken: string;
}
