import crypto from 'crypto-js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { prisma } from '../lib/prisma';

const twilioClient = (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_SID.startsWith('AC')) ?
  twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN) : null;

const transporter = (process.env.SENDGRID_API_KEY &&
  !process.env.SENDGRID_API_KEY.includes('your_')) ?
  nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  }) : null;

export class OtpService {
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static hashOtp(otp: string): string {
    return crypto.SHA256(otp + (process.env.OTP_SALT || 'default_salt')).toString();
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidMobile(mobile: string): boolean {
    try {
      return isValidPhoneNumber(mobile);
    } catch {
      return false;
    }
  }

  static normalizePhoneNumber(mobile: string): string | null {
    try {
      const phoneNumber = parsePhoneNumber(mobile);
      return phoneNumber.format('E.164');
    } catch {
      return null;
    }
  }

  static maskContact(contact: string): string {
    if (this.isValidEmail(contact)) {
      const [local, domain] = contact.split('@');
      const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
      return `${maskedLocal}@${domain}`;
    } else if (this.isValidMobile(contact)) {
      const normalized = this.normalizePhoneNumber(contact);
      if (normalized) {
        return normalized.slice(0, -6) + '****' + normalized.slice(-2);
      }
    }
    return contact;
  }

  static async canSendOtp(contact: string): Promise<{ canSend: boolean; reason?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentOtps = await prisma.otpLog.findMany({
      where: {
        contact,
        sentAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentOtps.length >= 3) {
      return { canSend: false, reason: 'Rate limit exceeded. Try again later.' };
    }

    return { canSend: true };
  }

  static async sendOtp(contact: string): Promise<{ success: boolean; maskedContact: string; error?: string }> {
    try {
      const rateLimitCheck = await this.canSendOtp(contact);
      if (!rateLimitCheck.canSend) {
        return { success: false, maskedContact: '', error: rateLimitCheck.reason };
      }

      const otp = this.generateOtp();
      const otpHash = this.hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await prisma.otpLog.create({
        data: {
          contact,
          otpHash,
          expiresAt,
        },
      });

      let sendResult = false;

      if (this.isValidEmail(contact)) {
        sendResult = await this.sendEmailOtp(contact, otp);
      } else if (this.isValidMobile(contact)) {
        const normalizedMobile = this.normalizePhoneNumber(contact);
        if (normalizedMobile) {
          sendResult = await this.sendSmsOtp(normalizedMobile, otp);
        }
      }

      return {
        success: sendResult,
        maskedContact: this.maskContact(contact),
        error: sendResult ? undefined : 'Failed to send OTP',
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, maskedContact: '', error: 'Internal server error' };
    }
  }

  static async verifyOtp(contact: string, otp: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const otpHash = this.hashOtp(otp);
      const now = new Date();

      const otpRecord = await prisma.otpLog.findFirst({
        where: {
          contact,
          otpHash,
          expiresAt: {
            gt: now,
          },
          usedAt: null,
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      if (!otpRecord) {
        // Increment attempts for rate limiting
        await prisma.otpLog.updateMany({
          where: {
            contact,
            expiresAt: {
              gt: now,
            },
          },
          data: {
            attempts: {
              increment: 1,
            },
          },
        });

        return { valid: false, error: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await prisma.otpLog.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          usedAt: now,
        },
      });

      return { valid: true };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { valid: false, error: 'Internal server error' };
    }
  }

  private static async sendEmailOtp(email: string, otp: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        return true;
      }

      if (!transporter) {
        console.log(`[DEV] Email service not configured. OTP for ${email}: ${otp}`);
        return true;
      }

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@EcoFarmLogix.com',
        to: email,
        subject: 'Your EcoFarmLogix Verification Code',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00ffff; margin: 0;">🌱 EcoFarmLogix</h1>
            </div>
            <div style="background: #1a1a1a; border: 1px solid #00ffff; border-radius: 10px; padding: 30px; text-align: center;">
              <h2 style="color: #ffffff; margin-bottom: 20px;">Verification Code</h2>
              <div style="background: #000; border: 2px solid #00ff88; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #00ff88; letter-spacing: 5px;">${otp}</span>
              </div>
              <p style="color: #cccccc; margin: 20px 0;">Enter this code to complete your authentication.</p>
              <p style="color: #888888; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      return false;
    }
  }

  private static async sendSmsOtp(mobile: string, otp: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
        console.log(`[DEV] OTP for ${mobile}: ${otp}`);
        return true;
      }

      if (!twilioClient) {
        console.log(`[DEV] SMS service not configured. OTP for ${mobile}: ${otp}`);
        return true;
      }

      await twilioClient.messages.create({
        body: `Your EcoFarmLogix verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: mobile,
      });
      return true;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      return false;
    }
  }
}