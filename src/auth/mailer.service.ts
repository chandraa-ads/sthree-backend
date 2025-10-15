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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 30px; color: #444;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://yourcompany.com/images/sthree-logo.png" alt="SThree" style="width: 160px; object-fit: contain;" />
          </div>

          <h1 style="font-weight: 700; color: #2E86DE; text-align: center; margin-bottom: 10px;">Welcome to SThree!</h1>
          <p style="font-size: 16px; text-align: center; margin: 0 0 20px;">Your one-time password (OTP) code is:</p>

          <div style="font-size: 40px; font-weight: 700; color: #2E86DE; text-align: center; letter-spacing: 8px; margin-bottom: 30px; user-select: all;">
            ${otp}
          </div>

          <p style="text-align: center; font-size: 14px; color: #666; margin-bottom: 30px;">This OTP will expire in <strong>10 minutes</strong>.</p>

          <div style="text-align: center;">
            <a href="https://yourcompany.com/verify" 
               style="background-color: #2E86DE; color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-weight: 600; display: inline-block; box-shadow: 0 5px 15px rgba(46, 134, 222, 0.4); transition: background-color 0.3s ease;">
              Verify Now
            </a>
          </div>

          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
            If you did not request this OTP, please ignore this email or contact support.
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
