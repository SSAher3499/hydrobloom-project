import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { AuthService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

type LoginFormData = {
  contact: string;
};

const loginSchema: yup.ObjectSchema<LoginFormData> = yup.object({
  contact: yup.string().required('Email or mobile number is required'),
}).required();

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpSent, setShowOtpSent] = useState(false);
  const [maskedContact, setMaskedContact] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: yupResolver<LoginFormData>(loginSchema),
    defaultValues: {
      contact: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.sendOtp(data.contact);

      if (result.success) {
        setShowOtpSent(true);
        setMaskedContact(result.maskedContact || '');
        setTimeout(() => {
          navigate('/otp-verify', {
            state: {
              contact: data.contact,
              maskedContact: result.maskedContact
            }
          });
        }, 2000);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = (contact: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(contact);
  };

  const currentContact = getValues('contact') || '';

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent mb-2">
            🌱 EcoFarmLogix
          </h1>
          <p className="text-gray-400 text-lg">Welcome back to the future of farming</p>
        </div>

        {/* Success Message */}
        {showOtpSent && (
          <div className="bg-dark-900 border border-neon-green rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="h-6 w-6 text-neon-green" />
            </div>
            <h3 className="text-lg font-semibold text-neon-green mb-2">OTP Sent!</h3>
            <p className="text-gray-300">
              We've sent a verification code to {maskedContact}
            </p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to verification page...</p>
          </div>
        )}

        {/* Login Form */}
        {!showOtpSent && (
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-gray-400">Enter your email or mobile number to get started</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isEmail(currentContact) ? (
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    {...register('contact')}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                    placeholder="Enter email or mobile number"
                    disabled={isLoading}
                  />
                </div>
                {errors.contact && (
                  <p className="text-red-400 text-sm mt-1">{errors.contact.message}</p>
                )}
              </div>

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
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-green text-dark-900 font-bold py-3 px-4 rounded-lg hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </button>

              {/* Alternative Options */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark-900 text-gray-400">or</span>
                  </div>
                </div>

                <Link
                  to="/login/password"
                  state={{ contact: currentContact }}
                  className="w-full bg-dark-800 border border-dark-600 text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-dark-700 hover:border-neon-cyan transition-all duration-300 text-center block"
                >
                  Login with Password
                </Link>

                <Link
                  to="/register"
                  className="w-full bg-transparent border border-neon-green text-neon-green font-medium py-3 px-4 rounded-lg hover:bg-neon-green hover:text-dark-900 transition-all duration-300 text-center block"
                >
                  Create New Account
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 EcoFarmLogix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;