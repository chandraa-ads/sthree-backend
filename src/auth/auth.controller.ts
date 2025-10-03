import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ---------------- USER ----------------
  @Post('user/register')
  @ApiOperation({ summary: 'Register as user with email/password and OTP' })
  @ApiBody({ type: RegisterDto })
  async registerUser(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Post('user/verify-otp')
  @ApiOperation({ summary: 'Verify OTP sent to email during registration' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }


  @Post('user/login')
  @ApiOperation({ summary: 'Login as user with email/password' })
  @ApiBody({ type: LoginDto })
  async loginUser(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto);
  }

@Post('google')
async googleLogin(@Body() dto: GoogleLoginDto) {
  return this.authService.googleAuth(dto.idToken);
}


  @Post('user/facebook')
  @ApiOperation({ summary: 'Login/Register with Facebook OAuth' })
  async loginWithFacebook(@Body('accessToken') accessToken: string) {
    return this.authService.facebookAuth(accessToken);
  }

  @Post('user/forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP for user' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email, 'user');
  }

  @Post('user/reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.email, body.reset_code, body.new_password);
  }

  // ---------------- ADMIN ----------------
  @Post('admin/register')
  @ApiOperation({ summary: 'Register admin (super-admin only)' })
  @ApiBody({ type: RegisterDto })
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Login as admin with email/password' })
  @ApiBody({ type: LoginDto })
  async loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('admin/forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP for admin' })
  async adminForgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email, 'admin');
  }

  @Post('admin/reset-password')
  @ApiOperation({ summary: 'Reset password for admin using OTP' })
  async adminResetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.email, body.reset_code, body.new_password);
  }
}
