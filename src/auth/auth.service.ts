import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabase } from '../config/database.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '../common/enums/role.enum';
import { OAuth2Client } from 'google-auth-library';
import { MailerService } from './mailer.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(private readonly mailerService: MailerService) {}

  // ---------------- REGISTER ----------------
  async registerUser(dto: RegisterDto) {
    return this.register(dto, Role.USER, true);
  }

  async registerAdmin(dto: RegisterDto) {
    return this.register(dto, Role.ADMIN, false);
  }

  private async register(dto: RegisterDto, role: Role, requireOtp: boolean) {
    const { email, username, password } = dto;

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) throw new ConflictException('Email already registered');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, username, password: hashedPassword, role, email_verified: !requireOtp }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Registration failed: ' + error.message);

    // Generate and send OTP if required
    if (requireOtp) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase.from('user_otps').insert({
        user_id: data.id,
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      });

      await this.mailerService.sendOtp(email, otp);
    }

    return {
      message: requireOtp
        ? 'User registered successfully. OTP sent to email'
        : 'Admin registered successfully',
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role,
        email_verified: data.email_verified,
      },
    };
  }

  // ---------------- VERIFY OTP ----------------
  async verifyOtp(email: string, otp: string) {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) throw new NotFoundException('User not found');

    const { data: otpData } = await supabase
      .from('user_otps')
      .select('*')
      .eq('user_id', user.id)
      .eq('otp', otp)
      .maybeSingle();

    if (!otpData) throw new UnauthorizedException('Invalid OTP');

    await supabase.from('users').update({ email_verified: true }).eq('id', user.id);
    await supabase.from('user_otps').delete().eq('id', otpData.id);

    return { message: 'Email verified successfully', email_verified: true };
  }

  // ---------------- LOGIN ----------------
  async loginUser(dto: LoginDto) {
    return this.login(dto, Role.USER);
  }

  async loginAdmin(dto: LoginDto) {
    return this.login(dto, Role.ADMIN);
  }

  private async login(dto: LoginDto, role: Role) {
    const { email, password } = dto;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .single();

    if (error || !data) throw new UnauthorizedException('Invalid credentials');
    if (!data.email_verified) throw new UnauthorizedException('Email not verified');

    const valid = await bcrypt.compare(password, data.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign(
      { sub: data.id, role: data.role, email: data.email, username: data.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return {
      message: role === Role.USER ? 'User login successful' : 'Admin login successful',
      token,
      user: { id: data.id, username: data.username, email: data.email, role: data.role },
    };
  }

  // ---------------- PASSWORD RESET ----------------
  async forgotPassword(email: string, role: Role | 'user' | 'admin') {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq(role === 'user' ? 'role' : 'role', role === 'user' ? Role.USER : Role.ADMIN)
      .maybeSingle();

    if (!user) throw new NotFoundException('User not found');

    const reset_code = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('password_resets').upsert({ email, reset_code }).single();

    await this.mailerService.sendResetCode(email, reset_code);

    return { message: 'Password reset code sent to email' };
  }

  async resetPassword(email: string, reset_code: string, new_password: string) {
    const { data: reset } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('reset_code', reset_code)
      .maybeSingle();

    if (!reset) throw new UnauthorizedException('Invalid reset code');

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('email', email);

    if (error) throw new InternalServerErrorException('Failed to reset password');
    await supabase.from('password_resets').delete().eq('email', email);

    return { message: 'Password reset successful' };
  }

  // ---------------- GOOGLE AUTH ----------------
  async googleAuth(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.name) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const email = payload.email;
    const name = payload.name;

    let { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) {
      const { data } = await supabase
        .from('users')
        .insert({ email, username: name, role: Role.USER, email_verified: true })
        .select()
        .single();
      user = data;
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { message: 'Google login successful', token, user };
  }

  // ---------------- FACEBOOK AUTH ----------------
  async facebookAuth(accessToken: string) {
    const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const profile: { email?: string; name?: string } = await res.json();

    if (!profile?.email || !profile?.name) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const email = profile.email;
    const name = profile.name;

    let { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) {
      const { data } = await supabase
        .from('users')
        .insert({ email, username: name, role: Role.USER, email_verified: true })
        .select()
        .single();
      user = data;
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { message: 'Facebook login successful', token, user };
  }
}
