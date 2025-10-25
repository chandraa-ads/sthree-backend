import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address associated with the account',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP sent to the user email for password reset',
  })
  @IsNotEmpty({ message: 'Reset code is required' })
  @Matches(/^\d{6}$/, { message: 'Reset code must be a 6-digit number' })
  reset_code: string;

  @ApiProperty({
    example: 'newStrongPass123',
    description:
      'New password. Minimum 6 characters, must include letters and numbers',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/, {
    message: 'Password must contain letters and numbers',
  })
  new_password: string;
}
