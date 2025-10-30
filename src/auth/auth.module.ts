import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { MailerService } from './mailer.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
    SupabaseModule, // ✅ Supabase replaces TypeORM
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, MailerService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
