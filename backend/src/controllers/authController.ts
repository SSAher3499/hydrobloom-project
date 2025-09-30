import { Request, Response } from 'express';
import { OtpService } from '../services/otpService';
import { AuthService } from '../services/authService';

export class AuthController {
  static async sendOtp(req: Request, res: Response) {
    try {
      const { contact } = req.body;

      if (!contact) {
        return res.status(400).json({ error: 'Contact is required' });
      }

      if (!OtpService.isValidEmail(contact) && !OtpService.isValidMobile(contact)) {
        return res.status(400).json({ error: 'Invalid email or mobile number format' });
      }

      const result = await OtpService.sendOtp(contact);

      if (result.success) {
        res.json({
          success: true,
          message: 'OTP sent successfully',
          maskedContact: result.maskedContact,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { contact, otp } = req.body;

      if (!contact || !otp) {
        return res.status(400).json({ error: 'Contact and OTP are required' });
      }

      const result = await AuthService.loginWithOtp(contact, otp);

      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          user: result.user,
          firstTime: result.firstTime,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { contact, password } = req.body;

      if (!contact || !password) {
        return res.status(400).json({ error: 'Contact and password are required' });
      }

      const result = await AuthService.loginWithPassword(contact, password);

      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          user: result.user,
          firstTime: result.firstTime,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, email, mobile, location, address, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!OtpService.isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (mobile && !OtpService.isValidMobile(mobile)) {
        return res.status(400).json({ error: 'Invalid mobile number format' });
      }

      const result = await AuthService.register({
        name,
        email,
        mobile,
        location,
        address,
        password,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          token: result.token,
          user: result.user,
          firstTime: result.firstTime,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async me(req: any, res: Response) {
    try {
      const user = req.user;

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          languagePref: user.languagePref,
          onboardingCompleted: user.onboardingCompleted,
          locationLat: user.locationLat,
          locationLng: user.locationLng,
          locationPlaceId: user.locationPlaceId,
          address: user.address,
        },
      });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async completeOnboarding(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const success = await AuthService.completeOnboarding(userId);

      if (success) {
        res.json({
          success: true,
          message: 'Onboarding completed successfully',
        });
      } else {
        res.status(500).json({ error: 'Failed to complete onboarding' });
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}