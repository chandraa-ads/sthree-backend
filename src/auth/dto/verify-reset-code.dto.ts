import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP sent to email' })
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Reset code must be a 6-digit number' })
  reset_code: string;
}
