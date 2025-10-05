import { AssetType, InviteStatus, Role } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { OtpService } from './otpService';

export interface AssetData {
  type: AssetType;
  name?: string;
  macid: string;
}

export interface InviteData {
  email?: string;
  mobile?: string;
  role: Role;
  status: InviteStatus;
  languagePref: string;
}

export class OnboardingService {
  static async saveAssets(userId: string, assets: AssetData[]): Promise<{ success: boolean; error?: string; assets?: any[] }> {
    try {
      // Validate unique MACIDs
      const macids = assets.map(asset => asset.macid.toUpperCase());
      const uniqueMacids = new Set(macids);

      if (macids.length !== uniqueMacids.size) {
        return { success: false, error: 'Duplicate MAC IDs are not allowed' };
      }

      // Check if any MACID already exists in database
      const existingAssets = await prisma.asset.findMany({
        where: {
          controllerMacid: {
            in: macids,
          },
        },
      });

      if (existingAssets.length > 0) {
        const existingMacids = existingAssets.map(asset => asset.controllerMacid);
        return {
          success: false,
          error: `MAC ID(s) already registered: ${existingMacids.join(', ')}`
        };
      }

      // Get next available index for auto-naming
      const getNextIndex = async (type: AssetType): Promise<number> => {
        const existingAssetsOfType = await prisma.asset.findMany({
          where: {
            ownerId: userId,
            type,
          },
          select: {
            name: true,
          },
        });

        const indices = existingAssetsOfType
          .map(asset => {
            const match = asset.name.match(new RegExp(`${type.toLowerCase()} (\\d+)`, 'i'));
            return match ? parseInt(match[1]) : 0;
          })
          .filter(index => index > 0);

        return indices.length > 0 ? Math.max(...indices) + 1 : 1;
      };

      // Create assets with auto-naming for empty names
      const createdAssets = [];

      for (const asset of assets) {
        let assetName = asset.name?.trim();

        if (!assetName) {
          const nextIndex = await getNextIndex(asset.type);
          assetName = `${asset.type.charAt(0) + asset.type.slice(1).toLowerCase()} ${nextIndex}`;
        }

        const createdAsset = await prisma.asset.create({
          data: {
            ownerId: userId,
            type: asset.type,
            name: assetName,
            controllerMacid: asset.macid.toUpperCase(),
          },
        });

        createdAssets.push(createdAsset);
      }

      return {
        success: true,
        assets: createdAssets,
      };
    } catch (error) {
      console.error('Error saving assets:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  static async inviteUser(createdById: string, inviteData: InviteData): Promise<{ success: boolean; error?: string; invite?: any }> {
    try {
      const { email, mobile, role, languagePref } = inviteData;

      // Validate contact information
      if (!email && !mobile) {
        return { success: false, error: 'Either email or mobile is required' };
      }

      if (email && !OtpService.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (mobile && !OtpService.isValidMobile(mobile)) {
        return { success: false, error: 'Invalid mobile number format' };
      }

      const normalizedMobile = mobile ? OtpService.normalizePhoneNumber(mobile) : null;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(normalizedMobile ? [{ mobile: normalizedMobile }] : []),
          ],
        },
      });

      if (existingUser) {
        return { success: false, error: 'User already exists with this email or mobile' };
      }

      // Check if invite already exists
      const existingInvite = await prisma.invite.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(normalizedMobile ? [{ mobile: normalizedMobile }] : []),
          ],
          status: InviteStatus.PENDING,
        },
      });

      if (existingInvite) {
        return { success: false, error: 'Invite already sent to this contact' };
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invite = await prisma.invite.create({
        data: {
          email: email?.toLowerCase(),
          mobile: normalizedMobile,
          role,
          languagePref,
          token,
          expiresAt,
          createdById,
        },
      });

      // Send invite (implement based on your email/SMS service)
      await this.sendInvite(invite);

      return {
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          mobile: invite.mobile,
          role: invite.role,
          status: invite.status,
          createdAt: invite.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating invite:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  private static async sendInvite(invite: any): Promise<void> {
    try {
      // In development, just log the invite link
      if (process.env.NODE_ENV === 'development') {
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invite.token}`;
        console.log(`[DEV] Invite sent to ${invite.email || invite.mobile}: ${inviteLink}`);
        return;
      }

      // TODO: Implement actual email/SMS sending
      // This would integrate with your email service (SendGrid) or SMS service (Twilio)

    } catch (error) {
      console.error('Error sending invite:', error);
    }
  }

  static async getInviteByToken(token: string): Promise<any> {
    try {
      return await prisma.invite.findUnique({
        where: { token },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching invite:', error);
      return null;
    }
  }

  static async acceptInvite(token: string, userData: { name: string; password: string }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const invite = await this.getInviteByToken(token);

      if (!invite || invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
        return { success: false, error: 'Invalid or expired invite' };
      }

      // Create user from invite
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: invite.email,
          mobile: invite.mobile,
          role: invite.role,
          languagePref: invite.languagePref,
          passwordHash,
          emailVerified: !!invite.email,
          mobileVerified: !!invite.mobile,
          onboardingCompleted: true, // Users invited by others skip onboarding
        },
      });

      // Mark invite as accepted
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          languagePref: user.languagePref,
        },
      };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  static async getUserAssets(userId: string): Promise<any[]> {
    try {
      return await prisma.asset.findMany({
        where: {
          ownerId: userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } catch (error) {
      console.error('Error fetching user assets:', error);
      return [];
    }
  }

  static async getUserInvites(userId: string): Promise<any[]> {
    try {
      return await prisma.invite.findMany({
        where: {
          createdById: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching user invites:', error);
      return [];
    }
  }
}