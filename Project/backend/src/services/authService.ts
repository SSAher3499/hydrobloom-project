import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { OtpService } from './otpService';

export interface RegisterData {
  name: string;
  email: string;
  mobile?: string;
  location?: {
    lat: number;
    lng: number;
    place_id: string;
  };
  address?: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Partial<User>;
  firstTime?: boolean;
  error?: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateJWT(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );
  }

  static verifyJWT(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
      return decoded;
    } catch {
      return null;
    }
  }

  static async findUserByContact(contact: string): Promise<User | null> {
    const isEmail = OtpService.isValidEmail(contact);
    const isMobile = OtpService.isValidMobile(contact);

    if (isEmail) {
      return prisma.user.findUnique({
        where: { email: contact.toLowerCase() },
      });
    } else if (isMobile) {
      const normalizedMobile = OtpService.normalizePhoneNumber(contact);
      if (normalizedMobile) {
        return prisma.user.findUnique({
          where: { mobile: normalizedMobile },
        });
      }
    }

    return null;
  }

  static async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const { name, email, mobile, location, address, password } = data;

      // Normalize email and mobile
      const normalizedEmail = email.toLowerCase();
      const normalizedMobile = mobile ? OtpService.normalizePhoneNumber(mobile) : null;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(normalizedMobile ? [{ mobile: normalizedMobile }] : []),
          ],
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email or mobile number',
        };
      }

      // Create user
      const userData: any = {
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationPlaceId: location?.place_id,
        address,
        onboardingCompleted: false,
      };

      if (password) {
        userData.passwordHash = await this.hashPassword(password);
      }

      const user = await prisma.user.create({
        data: userData,
      });

      const token = this.generateJWT(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          languagePref: user.languagePref,
          onboardingCompleted: user.onboardingCompleted,
        },
        firstTime: true,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  static async loginWithPassword(contact: string, password: string): Promise<LoginResponse> {
    try {
      const user = await this.findUserByContact(contact);

      if (!user || !user.passwordHash) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      const isValidPassword = await this.comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      const token = this.generateJWT(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          languagePref: user.languagePref,
          onboardingCompleted: user.onboardingCompleted,
        },
        firstTime: !user.onboardingCompleted,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  static async loginWithOtp(contact: string, otp: string): Promise<LoginResponse> {
    try {
      const otpVerification = await OtpService.verifyOtp(contact, otp);

      if (!otpVerification.valid) {
        return {
          success: false,
          error: otpVerification.error,
        };
      }

      const user = await this.findUserByContact(contact);

      if (!user) {
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      }

      // Update verification status
      const isEmail = OtpService.isValidEmail(contact);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: isEmail ? true : user.emailVerified,
          mobileVerified: !isEmail ? true : user.mobileVerified,
        },
      });

      const token = this.generateJWT(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          languagePref: user.languagePref,
          onboardingCompleted: user.onboardingCompleted,
        },
        firstTime: !user.onboardingCompleted,
      };
    } catch (error) {
      console.error('OTP login error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedAssets: true,
        },
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async completeOnboarding(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
        },
      });
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }
}