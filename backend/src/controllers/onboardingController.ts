import { Request, Response } from 'express';
import { OnboardingService } from '../services/onboardingService';
import { AssetType, Role, InviteStatus } from '@prisma/client';

export class OnboardingController {
  static async saveAssets(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { assets } = req.body;

      if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ error: 'At least one asset is required' });
      }

      // Validate each asset
      for (const asset of assets) {
        if (!asset.type || !Object.values(AssetType).includes(asset.type)) {
          return res.status(400).json({ error: 'Invalid asset type' });
        }

        if (!asset.macid || typeof asset.macid !== 'string') {
          return res.status(400).json({ error: 'Controller MAC ID is required' });
        }

        // Validate MAC ID format (basic validation)
        const macidRegex = /^[a-fA-F0-9]{12}$|^([a-fA-F0-9]{2}[:-]){5}[a-fA-F0-9]{2}$/;
        if (!macidRegex.test(asset.macid.replace(/[:-]/g, ''))) {
          return res.status(400).json({ error: 'Invalid MAC ID format' });
        }
      }

      const result = await OnboardingService.saveAssets(userId, assets);

      if (result.success) {
        res.json({
          success: true,
          message: 'Assets saved successfully',
          assets: result.assets,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Save assets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async inviteUser(req: any, res: Response) {
    try {
      const createdById = req.user.id;
      const { email, mobile, role, languagePref = 'en' } = req.body;

      if (!email && !mobile) {
        return res.status(400).json({ error: 'Either email or mobile is required' });
      }

      if (!role || !Object.values(Role).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const result = await OnboardingService.inviteUser(createdById, {
        email,
        mobile,
        role,
        status: InviteStatus.PENDING,
        languagePref,
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Invite sent successfully',
          invite: result.invite,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserAssets(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const assets = await OnboardingService.getUserAssets(userId);

      res.json({
        success: true,
        assets,
      });
    } catch (error) {
      console.error('Get user assets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserInvites(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const invites = await OnboardingService.getUserInvites(userId);

      res.json({
        success: true,
        invites,
      });
    } catch (error) {
      console.error('Get user invites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getInvite(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Invite token is required' });
      }

      const invite = await OnboardingService.getInviteByToken(token);

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.status !== InviteStatus.PENDING) {
        return res.status(400).json({ error: 'Invite has already been used' });
      }

      if (invite.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      res.json({
        success: true,
        invite: {
          email: invite.email,
          mobile: invite.mobile,
          role: invite.role,
          languagePref: invite.languagePref,
          createdBy: invite.createdBy,
        },
      });
    } catch (error) {
      console.error('Get invite error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async acceptInvite(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { name, password } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Invite token is required' });
      }

      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const result = await OnboardingService.acceptInvite(token, { name, password });

      if (result.success) {
        res.json({
          success: true,
          message: 'Invite accepted successfully',
          user: result.user,
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Accept invite error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}