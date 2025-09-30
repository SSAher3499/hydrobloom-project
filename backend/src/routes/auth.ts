import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/complete-onboarding', authenticate, AuthController.completeOnboarding);

export default router;