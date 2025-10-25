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
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,  // Inject ConfigService
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(googleClientId);
  }
  // ---------------- REGISTER ----------------
  async registerUser(dto: RegisterDto) {
    return this.register(dto, Role.USER, true);
  }

async registerAdmin(dto: RegisterDto) {
  // Pass requireOtp = true for admin too
  return this.register(dto, Role.ADMIN, true);
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

  // Fetch updated user info
  const { data: updatedUser } = await supabase.from('users').select('*').eq('id', user.id).single();

  return {
    message: 'Email verified successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      email_verified: updatedUser.email_verified,
    },
  };
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
    this.configService.get<string>('JWT_SECRET'),
    { expiresIn: '7d' },
  );

  return {
    message: role === Role.USER ? 'User login successful' : 'Admin login successful',
    token,
    id: data.id, // ✅ return the user id
    username: data.username,
    email: data.email,
    role: data.role,
  };
}



// ---------------- FORGOT PASSWORD ----------------
async forgotPassword(email: string, role: Role | 'user' | 'admin') {
  const userRole = role === 'user' ? Role.USER : Role.ADMIN;

  // Check if user exists
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', userRole)
    .maybeSingle();

  if (findError) {
    console.error('Supabase user fetch error:', findError);
    throw new InternalServerErrorException('Database error while finding user');
  }

  if (!user) throw new NotFoundException('No account found for this email');

  // Generate OTP
  const reset_code = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove old OTPs
  await supabase.from('password_resets').delete().eq('email', email);

  // Save new OTP (no expiry)
  const { error: insertError } = await supabase
    .from('password_resets')
    .insert([{
      email,
      reset_code,
      created_at: new Date().toISOString(),
    }]);

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    throw new InternalServerErrorException('Failed to save reset code');
  }

  // Logging in IST
  console.log(`[ForgotPassword] OTP generated: ${reset_code}`);
  console.log(`[ForgotPassword] Server now (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  // Send OTP email
  try {
    await this.mailerService.sendResetCode(email, reset_code);
  } catch (mailError) {
    console.error('Email send error:', mailError);
    throw new InternalServerErrorException('Failed to send reset code email');
  }

  return { message: 'Password reset OTP sent successfully' };
}

// ---------------- VERIFY RESET CODE ----------------
async verifyResetCode(email: string, reset_code: string) {
  const { data: resetRecords, error: fetchError } = await supabase
    .from('password_resets')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error(fetchError);
    throw new InternalServerErrorException('Database error');
  }

  const resetRecord = resetRecords?.[0];
  if (!resetRecord) throw new UnauthorizedException('Invalid or incorrect OTP');

  // Logging in IST
  console.log(`[VerifyResetCode] OTP in DB: ${resetRecord.reset_code}`);
  console.log(`[VerifyResetCode] Server now (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  // Check OTP match
  if (resetRecord.reset_code.trim() !== reset_code.trim()) {
    throw new UnauthorizedException('Invalid or incorrect OTP');
  }

  return { message: 'OTP verified successfully. You can now reset your password.' };
}

// ---------------- RESET PASSWORD ----------------
async resetPassword(email: string, reset_code: string, new_password: string) {
  const { data: resetRecords, error: fetchError } = await supabase
    .from('password_resets')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error(fetchError);
    throw new InternalServerErrorException('Database error');
  }

  const resetRecord = resetRecords?.[0];
  if (!resetRecord || resetRecord.reset_code.trim() !== reset_code.trim()) {
    throw new UnauthorizedException('Invalid or incorrect OTP');
  }

  // Logging in IST
  console.log(`[ResetPassword] OTP in DB: ${resetRecord.reset_code}`);
  console.log(`[ResetPassword] Server now (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  // Hash new password
  const hashedPassword = await bcrypt.hash(new_password, 10);

  // Update user password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', email);

  if (updateError) {
    console.error('Supabase password update error:', updateError);
    throw new InternalServerErrorException('Failed to reset password');
  }

  // Delete OTP after success
  await supabase.from('password_resets').delete().eq('email', email);

  return { message: 'Password reset successfully. You can now log in.' };
}






  // ---------------- GOOGLE AUTH ----------------
// auth.service.ts




  
// ---------------- GOOGLE AUTH ----------------

// In your AuthService class, replace the existing googleLoginOrRegister method with this:

async googleLoginOrRegister(idToken: string, role: 'user' | 'admin') {
  let ticket;

  try {
    ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
  } catch (error) {
    console.error('Invalid Google token:', error);
    throw new UnauthorizedException('Invalid Google token');
  }

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new UnauthorizedException('Google token payload missing email');
  }

  const email = payload.email;
  const fullName = payload.name || '';
  const username = fullName.split(' ')[0]?.toLowerCase() || email.split('@')[0];

  // Admin-specific validation
  if (role === 'admin') {
    if (!email.endsWith('@yourcompany.com')) {
      throw new UnauthorizedException('Admin login restricted to company emails');
    }
  }

  // Check if user already exists
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', role)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Database error while fetching user:', selectError.message);
    throw new InternalServerErrorException('Database error');
  }

  let finalUser = existingUser;
  let isNewUser = false;

  if (!existingUser) {
    // Insert new user with email_verified true and no password (no OTP)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        full_name: fullName,
        email_verified: true,  // <-- Set to true immediately
        role,
        password: '',          // or null if your DB accepts it
      })
      .select()
      .single();

    if (insertError) {
      console.error('User creation failed:', insertError.message);
      throw new InternalServerErrorException('User creation failed');
    }

    finalUser = newUser;
    isNewUser = true;
  } else if (!existingUser.email_verified) {
    // If user exists but email_verified false, update it to true
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('Failed to update email_verified:', updateError.message);
      throw new InternalServerErrorException('Failed to verify email');
    }

    finalUser.email_verified = true;
  }

  // Generate token immediately
  const token = jwt.sign(
    {
      sub: finalUser.id,
      email: finalUser.email,
      username: finalUser.username,
      role: finalUser.role,
    },
    this.configService.get<string>('JWT_SECRET'),
    { expiresIn: '7d' },
  );

  return {
    message: isNewUser
      ? `Welcome, new ${role}! Registration successful.`
      : `Welcome back, ${role}! Login successful.`,
    token,
    user: {
      id: finalUser.id,
      email: finalUser.email,
      username: finalUser.username,
      role: finalUser.role,
      email_verified: true,
      isNewUser,  // <-- send flag to frontend
    },
  };
}



  async googleLoginOrRegisterAdmin(idToken: string) {
    return this.googleLoginOrRegister(idToken, 'admin');
  }








  // ---------------- FACEBOOK AUTH ----------------
// Assuming you already have the imports for UnauthorizedException, jwt, supabase, Role, etc.

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


async logout(userId: string) {
  // Stateless logout - nothing to do server-side unless you're blacklisting tokens
  return { message: 'Logout successful' };
}


}
