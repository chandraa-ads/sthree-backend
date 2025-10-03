import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

async sendOtp(email: string, otp: string) {
  try {
    await this.transporter.sendMail({
      from: `"SThree" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
          <!-- Company Logo -->
          <img src="https://yourcompany.com/logo.png" alt="SThree" style="width: 150px; margin-bottom: 20px;" />

          <h2>Welcome to SThree!</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #2E86DE;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>

          <!-- Button -->
          <a href="https://yourcompany.com/verify" 
             style="display: inline-block; padding: 12px 25px; margin-top: 20px; background-color: #2E86DE; color: #fff; text-decoration: none; border-radius: 5px;">
            Verify Now
          </a>

          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            If you did not request this OTP, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    throw new InternalServerErrorException('Failed to send OTP email: ' + error.message);
  }
}


  async sendResetCode(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: `"SThree" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is ${code}. Use it to reset your password.`,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to send reset email: ' + error.message);
    }
  }
}
