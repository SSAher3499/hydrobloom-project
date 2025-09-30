import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = true,
  redirectTo,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  // Check onboarding completion
  if (requireAuth && requireOnboarding && user && !user.onboardingCompleted) {
    // Allow access to onboarding pages
    if (location.pathname.startsWith('/onboarding')) {
      return <>{children}</>;
    }
    return <Navigate to="/onboarding/assets" replace />;
  }

  // Redirect completed users away from onboarding
  if (requireAuth && user && user.onboardingCompleted && location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;