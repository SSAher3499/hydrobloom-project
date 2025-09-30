import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  UserPlusIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { OnboardingService, InviteUser } from '../services/onboardingService';
import { AuthService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object().shape({
  contact: yup.string().required('Email or mobile number is required'),
  role: yup.string().oneOf(['OWNER', 'ADMIN', 'FARM_MANAGER', 'VIEWER']).required('Role is required'),
  languagePref: yup.string().oneOf(['en', 'hi']).required('Language preference is required'),
});

interface FormData {
  contact: string;
  role: 'OWNER' | 'ADMIN' | 'FARM_MANAGER' | 'VIEWER';
  languagePref: 'en' | 'hi';
}

const OnboardingUsers: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'FARM_MANAGER',
      languagePref: 'en',
    },
  });

  const isEmail = (contact: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(contact);
  };

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const inviteData: InviteUser = {
        role: data.role,
        languagePref: data.languagePref,
      };

      if (isEmail(data.contact)) {
        inviteData.email = data.contact;
      } else {
        inviteData.mobile = data.contact;
      }

      const result = await OnboardingService.inviteUser(token, inviteData);

      if (result.success) {
        setInvitedUsers([...invitedUsers, { ...result.invite, contact: data.contact }]);
        setSuccess(`Invite sent successfully to ${data.contact}`);
        reset();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to send invite');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.completeOnboarding(token);

      if (result.success) {
        updateUser({ onboardingCompleted: true });
        setCurrentStep(2);

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('Failed to complete onboarding');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (invitedUsers.length === 0) {
      setShowSkipWarning(true);
    } else {
      handleFinishOnboarding();
    }
  };

  const confirmSkip = () => {
    setShowSkipWarning(false);
    handleFinishOnboarding();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'FARM_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VIEWER':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-dark-900 rounded-xl border border-neon-green p-8 text-center">
            <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-10 w-10 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to EcoFarmLogix!</h2>
            <p className="text-gray-300 mb-2">
              Your account has been set up successfully.
            </p>
            <p className="text-gray-400 text-sm">
              {invitedUsers.length > 0
                ? `${invitedUsers.length} user invite${invitedUsers.length > 1 ? 's' : ''} sent.`
                : 'You can invite team members later from the dashboard.'
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent mb-2">
            🌱 EcoFarmLogix
          </h1>
          <p className="text-gray-400 text-lg">Almost done, {user?.name}!</p>
          <p className="text-gray-500">Invite team members to collaborate</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-neon-green rounded-full text-dark-900 font-bold text-sm">
                ✓
              </div>
              <p className="text-xs text-neon-green mt-1 text-center">Assets</p>
            </div>
            <div className="flex-1 h-1 bg-neon-cyan mx-4"></div>
            <div className="flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-neon-cyan rounded-full text-dark-900 font-bold text-sm">
                2
              </div>
              <p className="text-xs text-neon-cyan mt-1 text-center">Users</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite Form */}
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlusIcon className="h-8 w-8 text-neon-cyan" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Invite Team Members</h2>
              <p className="text-gray-400 text-sm">
                Add colleagues to help manage your farm operations
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <input
                    {...register('contact')}
                    type="text"
                    className="w-full pl-4 pr-10 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                    placeholder="colleague@example.com or +1234567890"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.contact && (
                  <p className="text-red-400 text-sm mt-1">{errors.contact.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                >
                  <option value="FARM_MANAGER">Farm Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="OWNER">Owner</option>
                </select>
                {errors.role && (
                  <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language Preference
                </label>
                <select
                  {...register('languagePref')}
                  className="w-full px-3 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
                {errors.languagePref && (
                  <p className="text-red-400 text-sm mt-1">{errors.languagePref.message}</p>
                )}
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neon-cyan text-dark-900 font-bold py-3 px-4 rounded-lg hover:bg-neon-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Invite...
                  </span>
                ) : (
                  'Send Invite'
                )}
              </button>
            </form>
          </div>

          {/* Invited Users & Actions */}
          <div className="space-y-6">
            {/* Invited Users List */}
            {invitedUsers.length > 0 && (
              <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Invited Users ({invitedUsers.length})</h3>
                <div className="space-y-3">
                  {invitedUsers.map((invite, index) => (
                    <div key={index} className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                      <div>
                        <p className="text-white text-sm font-medium">{invite.contact}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(invite.role)}`}>
                            {invite.role}
                          </span>
                          <span className="text-gray-400 text-xs">{invite.languagePref === 'en' ? 'English' : 'हिन्दी'}</span>
                        </div>
                      </div>
                      <CheckCircleIcon className="h-5 w-5 text-neon-green" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ready to Continue?</h3>
              <div className="space-y-3">
                <button
                  onClick={handleFinishOnboarding}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-green text-dark-900 font-bold py-3 px-4 rounded-lg hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finishing Setup...
                    </span>
                  ) : (
                    'Complete Setup & Go to Dashboard'
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="w-full bg-transparent border border-gray-600 text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-dark-800 hover:border-neon-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {invitedUsers.length > 0 ? 'Finish Without More Invites' : 'Skip User Invitations'}
                </button>
              </div>

              {invitedUsers.length === 0 && (
                <p className="text-gray-500 text-xs mt-3 text-center">
                  You can always invite team members later from your dashboard
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skip Warning Modal */}
        {showSkipWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-dark-900 rounded-xl border border-yellow-500 p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-bold text-white">Skip User Invitations?</h3>
              </div>
              <p className="text-gray-300 mb-6">
                You haven't invited any team members yet. You can always do this later from your dashboard settings.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmSkip}
                  className="flex-1 bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Yes, Continue
                </button>
                <button
                  onClick={() => setShowSkipWarning(false)}
                  className="flex-1 bg-dark-700 text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>© 2024 EcoFarmLogix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingUsers;