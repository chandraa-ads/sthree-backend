import { ApiProperty } from '@nestjs/swagger/dist';
import { IsString } from 'class-validator';

export class FacebookLoginDto {
    @ApiProperty({ description: 'Facebook token from client', example: 'eyJhbGciOiJI...' })
    @IsString()
    accessToken: string;
}
