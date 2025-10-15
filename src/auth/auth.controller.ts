import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Role } from '../common/enums/role.enum';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { LogoutUserDto } from './dto/logout-user.dto';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    username?: string;
    iat?: number;
    exp?: number;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('user/google')
  async googleLoginUser(@Body() body: GoogleLoginDto) {
    return this.authService.googleLoginOrRegister(body.idToken, 'user');
  }

  @Post('admin/google')
  async googleLoginAdmin(@Body() body: GoogleLoginDto) {
    return this.authService.googleLoginOrRegisterAdmin(body.idToken);
  }

  @Post('user/facebook')
  @ApiOperation({ summary: 'Login/Register with Facebook OAuth' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async loginWithFacebook(@Body() facebookLoginDto: FacebookLoginDto) {
    return this.authService.facebookAuth(facebookLoginDto.accessToken);
  }

  @Post('user/forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP for user' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email, 'user');
  }

  @Post('user/reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(
      body.email,
      body.reset_code,
      body.new_password,
    );
  }

  // ---------------- ADMIN ----------------
  @Post('admin/register')
  @ApiOperation({ summary: 'Register admin (super-admin only)' })
  @ApiBody({ type: RegisterDto })
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('admin/verify-otp')
  @ApiOperation({ summary: 'Verify OTP sent to email during admin registration' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyAdminOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
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
    return this.authService.resetPassword(
      body.email,
      body.reset_code,
      body.new_password,
    );
  }

  // ---------------- LOGOUT ----------------
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user/admin (stateless, just remove token on client)',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logoutUser(
    @Body() dto: LogoutUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    let userId: string | undefined;

    if (req.user?.sub) {
      userId = req.user.sub;
    }

    // Optional fallback
    if (!userId && dto.id) {
      userId = dto.id;
    }

    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    console.log('🚪 Logging out user with ID:', userId);

    // Example: revoke refresh tokens here if used
    // await this.authService.logout(userId);

    return {
      message: `User ${userId} logged out successfully`,
    };
  }
}
