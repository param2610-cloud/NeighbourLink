import React from 'react';
import { Eye, Image, FileText } from 'lucide-react';
import { BusinessCollection } from '../types';

interface QuickActionsSectionProps {
  businessData: BusinessCollection;
  onViewInsights: () => void;
  onViewGallery: () => void;
  onViewVerificationDocument: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  businessData,
  onViewInsights,
  onViewGallery,
  onViewVerificationDocument,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onViewInsights();
          }}
          className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
        >
          <Eye className="w-5 h-5 text-blue-600" />
          <span>View Insights</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onViewGallery();
          }}
          className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
        >
          <Image className="w-5 h-5 text-green-600" />
          <span>Your Gallery ({businessData?.gallery?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onViewVerificationDocument();
          }}
          className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
        >
          <FileText className="w-5 h-5 text-purple-600" />
          <span>Verification Document</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsSection;
