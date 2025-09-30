import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyJWT(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await AuthService.getUserById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireOnboarding = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.onboardingCompleted) {
    return res.status(403).json({
      error: 'Onboarding required',
      redirectTo: '/onboarding/assets'
    });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};