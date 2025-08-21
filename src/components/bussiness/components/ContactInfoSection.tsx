import React from 'react';
import { Edit, Phone, CreditCard } from 'lucide-react';
import { BusinessCollection } from '../types';
import WarningCard from './WarningCard';

interface TempContactInfo {
  phone: string;
  accountDetails: string;
}

interface ContactInfoSectionProps {
  businessData: BusinessCollection;
  editingContact: boolean;
  tempContact: TempContactInfo;
  loading: boolean;
  isContactIncomplete: () => boolean;
  onEditContact: () => void;
  onSaveContact: () => void;
  onCancelContact: () => void;
  onTempContactChange: (updates: Partial<TempContactInfo>) => void;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  businessData,
  editingContact,
  tempContact,
  loading,
  isContactIncomplete,
  onEditContact,
  onSaveContact,
  onCancelContact,
  onTempContactChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Contact & Payment Information
          </h3>
          {!editingContact && (
            <button
              onClick={onEditContact}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {/* Contact Information Warning */}
        {isContactIncomplete() && !editingContact && (
          <WarningCard
            title="Contact Information Missing"
            message="Add your phone number so customers can reach you directly."
            actionText="Add Phone Number"
            onAction={onEditContact}
            icon={<Phone className="w-5 h-5 text-amber-600" />}
          />
        )}

        {editingContact ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={tempContact.phone}
                  onChange={(e) => onTempContactChange({ phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your business phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Details (Optional)
                </label>
                <input
                  type="text"
                  value={tempContact.accountDetails}
                  onChange={(e) => onTempContactChange({ accountDetails: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="UPI ID, Account details, etc."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onSaveContact}
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
                onClick={onCancelContact}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {businessData.contact?.phone || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  businessData.contact?.verified ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {businessData.contact?.verified ? 'Verified' : 'Not verified'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Details
                  </div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {businessData.paymentSupport?.accountDetails || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfoSection;
