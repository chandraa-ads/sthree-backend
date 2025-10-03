import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from '../users/entities/user.entity';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    }),
    TypeOrmModule.forFeature([UserEntity]),
    UsersModule
  ],
  providers: [AuthService, JwtStrategy, MailerService],
  controllers: [AuthController]
})
export class AuthModule {}
