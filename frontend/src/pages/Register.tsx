import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  UserIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { AuthService, RegisterData } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  name: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Invalid email format'),
  mobile: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
  address: yup.string(),
  password: yup.string().min(8, 'Password must be at least 8 characters'),
});

interface FormData {
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  password?: string;
}

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    place_id: string;
    address: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const registerData: RegisterData = {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        password: data.password,
        location: selectedLocation ? {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          place_id: selectedLocation.place_id,
        } : undefined,
      };

      const result = await AuthService.register(registerData);

      if (result.success && result.token && result.user) {
        login(result.token, result.user);

        if (result.firstTime) {
          navigate('/onboarding/assets');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple location picker (in a real app, integrate with Google Places API)
  const handleLocationSelect = () => {
    // For demo purposes, we'll simulate location selection
    // In production, integrate with Google Places Autocomplete
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            place_id: 'demo_place_id',
            address: 'Current Location',
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location. Please enter address manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent mb-2">
            🌱 EcoFarmLogix
          </h1>
          <p className="text-gray-400 text-lg">Join the future of farming</p>
        </div>

        {/* Registration Form */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlusIcon className="h-8 w-8 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('mobile')}
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  placeholder="Enter mobile number (optional)"
                  disabled={isLoading}
                />
              </div>
              {errors.mobile && (
                <p className="text-red-400 text-sm mt-1">{errors.mobile.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <button
                type="button"
                onClick={handleLocationSelect}
                className="w-full flex items-center justify-center px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-400 hover:text-neon-cyan hover:border-neon-cyan transition-all duration-200"
                disabled={isLoading}
              >
                <MapPinIcon className="h-5 w-5 mr-2" />
                {selectedLocation ? 'Location Selected' : 'Select Location (Optional)'}
              </button>
              {selectedLocation && (
                <p className="text-neon-cyan text-sm mt-1">
                  ✓ Location captured successfully
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter your detailed address (optional)"
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-red-400 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-4 pr-10 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                  placeholder="Create a password (optional)"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-neon-cyan transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Optional: If not provided, you'll login using OTP only
              </p>
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
              className="w-full bg-gradient-to-r from-neon-green to-neon-cyan text-dark-900 font-bold py-3 px-4 rounded-lg hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Back to Login */}
            <Link
              to="/login"
              className="flex items-center justify-center text-gray-400 hover:text-neon-cyan transition-colors duration-200 text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neon-cyan hover:text-neon-green transition-colors duration-200 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 EcoFarmLogix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;