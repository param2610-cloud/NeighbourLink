import React from 'react';
import { FaStore } from 'react-icons/fa';
import { Edit, Camera } from 'lucide-react';
import { BusinessCollection } from '../types';
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";

interface TempBasicInfo {
  businessName: string;
  businessBio: string;
  address: string;
  latitude: number;
  longitude: number;
  deliverySupport: boolean;
}

interface BusinessHeroSectionProps {
  businessData: BusinessCollection;
  loading: boolean;
  editingBasic: boolean;
  tempBasic: TempBasicInfo;
  isProfileComplete: () => boolean;
  fileInputProfile: React.RefObject<HTMLInputElement | null>;
  fileInputCover: React.RefObject<HTMLInputElement | null>;
  onChangeProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditBasic: () => void;
  onSaveBasic: () => void;
  onCancelBasic: () => void;
  onTempBasicChange: (updates: Partial<TempBasicInfo>) => void;
};

const BusinessHeroSection: React.FC<BusinessHeroSectionProps> = ({
  businessData,
  loading,
  editingBasic,
  tempBasic,
  isProfileComplete,
  fileInputProfile,
  fileInputCover,
  onChangeProfile,
  onChangeCover,
  onEditBasic,
  onSaveBasic,
  onCancelBasic,
  onTempBasicChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <FaStore className="text-orange-700 dark:text-yellow-300 text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Business Overview
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {!editingBasic && (
              <button
                onClick={onEditBasic}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {!isProfileComplete() && (
              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-600 rounded-md px-3 py-1">
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Profile Incomplete
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative mb-6 group">
          {businessData.coverImage ? (
            <ImageDisplay
              publicId={businessData.coverImage}
              className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className="w-full h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Add cover image</span>
              </div>
            </div>
          )}
          <button
            onClick={() => fileInputCover.current?.click()}
            disabled={loading}
            className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </button>
          <input
            type="file"
            hidden
            ref={fileInputCover}
            onChange={onChangeCover}
            accept="image/*"
          />
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="relative group flex-shrink-0">
            {businessData.businessProfileImage ? (
              <ImageDisplay
                publicId={businessData.businessProfileImage}
                className="w-20 h-20 rounded-lg border-2 border-slate-200 dark:border-slate-600 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                <Camera className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <button
              onClick={() => fileInputProfile.current?.click()}
              disabled={loading}
              className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 text-blue-600 bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 border border-slate-200 dark:border-slate-600"
            >
              <Edit className="w-3 h-3" />
            </button>
            <input
              type="file"
              hidden
              ref={fileInputProfile}
              onChange={onChangeProfile}
              accept="image/*"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editingBasic ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempBasic.businessName}
                  onChange={(e) =>
                    onTempBasicChange({ businessName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Business Name"
                />
              </div>
            ) : (
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {businessData.businessName}
              </h3>
            )}
          </div>
        </div>

        {editingBasic ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Business Description
              </label>
              <textarea
                value={tempBasic.businessBio}
                onChange={(e) =>
                  onTempBasicChange({ businessBio: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe your business and what makes it special..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="deliverySupport"
                checked={tempBasic.deliverySupport}
                onChange={(e) =>
                  onTempBasicChange({ deliverySupport: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
              />
              <label htmlFor="deliverySupport" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Delivery Support Available
              </label>
            </div>
          </div>
        ) : (
          <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
            {businessData.businessBio ||
              "Manage your business presence, connect with customers, and grow your local network."}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              4.5
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Reviews
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {(businessData.services?.length || 0) + (businessData.products?.length || 0)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Items
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 items-center text-center">
            <div className="flex items-center gap-3 p-3 text-center rounded-lg">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                businessData.isVerified
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {businessData.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {businessData.deliverySupport ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Delivery
            </div>
          </div>
        </div>

        {editingBasic && (
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
            <button
              onClick={onSaveBasic}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={onCancelBasic}
              disabled={loading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessHeroSection;
