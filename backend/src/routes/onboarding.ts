import { Router } from 'express';
import { OnboardingController } from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (for invite handling)
router.get('/invite/:token', OnboardingController.getInvite);
router.post('/invite/:token/accept', OnboardingController.acceptInvite);

// Protected routes
router.post('/assets', authenticate, OnboardingController.saveAssets);
router.get('/assets', authenticate, OnboardingController.getUserAssets);
router.post('/invite-user', authenticate, OnboardingController.inviteUser);
router.get('/invites', authenticate, OnboardingController.getUserInvites);

export default router;