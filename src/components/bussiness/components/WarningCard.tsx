import React from 'react';
import { AlertTriangle, Edit } from 'lucide-react';

interface WarningCardProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const WarningCard: React.FC<WarningCardProps> = ({ 
  title, 
  message, 
  actionText, 
  onAction, 
  icon 
}) => {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icon || (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            {title}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {message}
          </p>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
            >
              <Edit className="w-3 h-3" />
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarningCard;
