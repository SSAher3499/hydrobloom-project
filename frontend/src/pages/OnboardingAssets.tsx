import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  PlusIcon,
  TrashIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { OnboardingService, Asset } from '../services/onboardingService';
import { useAuth } from '../contexts/AuthContext';

const assetSchema = yup.object({
  type: yup.string().oneOf(['POLYHOUSE', 'FERTIGATION']).required('Asset type is required'),
  name: yup.string(),
  macid: yup.string().required('Controller MAC ID is required').matches(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^[0-9A-Fa-f]{12}$/,
    'Invalid MAC ID format (e.g., AA:BB:CC:DD:EE:FF or AABBCCDDEEFF)'
  ),
});

const schema = yup.object({
  assets: yup.array().of(assetSchema).min(1, 'At least one asset is required'),
});

interface FormData {
  assets: Asset[];
}

const OnboardingAssets: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      assets: [{
        type: 'POLYHOUSE' as const,
        name: '',
        macid: '',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assets',
  });

  const watchedAssets = watch('assets');

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await OnboardingService.saveAssets(token, data.assets);

      if (result.success) {
        setCurrentStep(2);
        // Move to next onboarding step after showing success
        setTimeout(() => {
          navigate('/onboarding/users');
        }, 2000);
      } else {
        setError(result.error || 'Failed to save assets');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAsset = () => {
    append({
      type: 'POLYHOUSE' as const,
      name: '',
      macid: '',
    });
  };

  const removeAsset = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'POLYHOUSE':
        return <BuildingOffice2Icon className="h-6 w-6" />;
      case 'FERTIGATION':
        return <BeakerIcon className="h-6 w-6" />;
      default:
        return <BuildingOffice2Icon className="h-6 w-6" />;
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
            <h2 className="text-2xl font-bold text-white mb-4">Assets Added Successfully!</h2>
            <p className="text-gray-300 mb-2">
              Your {watchedAssets.length} asset{watchedAssets.length > 1 ? 's have' : ' has'} been configured.
            </p>
            <p className="text-gray-400 text-sm">Moving to user management...</p>
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
          <p className="text-gray-400 text-lg">Welcome, {user?.name}!</p>
          <p className="text-gray-500">Let's set up your first assets</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-neon-cyan rounded-full text-dark-900 font-bold text-sm">
                1
              </div>
              <p className="text-xs text-neon-cyan mt-1 text-center">Assets</p>
            </div>
            <div className="flex-1 h-1 bg-dark-600 mx-4">
              <div className="h-full bg-dark-600"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-dark-600 rounded-full text-gray-400 font-bold text-sm">
                2
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">Users</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Add Your Assets</h2>
            <p className="text-gray-400">
              Configure your polyhouses and fertigation systems. Each asset needs a unique controller MAC ID.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Assets */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-dark-800 rounded-lg border border-dark-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      {getAssetIcon(watchedAssets[index]?.type || 'POLYHOUSE')}
                      <span className="ml-2">Asset {index + 1}</span>
                    </h3>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAsset(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Asset Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Asset Type *
                      </label>
                      <select
                        {...register(`assets.${index}.type` as const)}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                        disabled={isLoading}
                      >
                        <option value="POLYHOUSE">Polyhouse</option>
                        <option value="FERTIGATION">Fertigation</option>
                      </select>
                      {errors.assets?.[index]?.type && (
                        <p className="text-red-400 text-sm mt-1">{errors.assets?.[index]?.type?.message}</p>
                      )}
                    </div>

                    {/* Asset Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Asset Name
                      </label>
                      <input
                        {...register(`assets.${index}.name` as const)}
                        type="text"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200"
                        placeholder="Leave blank for auto-naming"
                        disabled={isLoading}
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        Optional: Will auto-name if empty
                      </p>
                      {errors.assets?.[index]?.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.assets?.[index]?.name?.message}</p>
                      )}
                    </div>

                    {/* MAC ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Controller MAC ID *
                      </label>
                      <input
                        {...register(`assets.${index}.macid` as const)}
                        type="text"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-200 font-mono"
                        placeholder="AA:BB:CC:DD:EE:FF"
                        disabled={isLoading}
                      />
                      {errors.assets?.[index]?.macid && (
                        <p className="text-red-400 text-sm mt-1">{errors.assets?.[index]?.macid?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Asset Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={addAsset}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-dark-800 border border-neon-green text-neon-green rounded-lg hover:bg-neon-green hover:text-dark-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Another Asset
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-neon-cyan to-neon-green text-dark-900 font-bold py-3 px-8 rounded-lg hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Assets...
                  </span>
                ) : (
                  'Continue to User Management'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>© 2024 EcoFarmLogix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAssets;