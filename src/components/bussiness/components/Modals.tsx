import React from 'react';
import { X, BarChart3, TrendingUp, Users, Plus, Trash2, Heart, Star, MessageSquare, Eye } from 'lucide-react';
import { BusinessCollection, Review } from '../types';
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";

interface ModalsProps {
  showStatisticsModal: boolean;
  showGalleryDrawer: boolean;
  businessData: BusinessCollection;
  reviews: Review[];
  loading: boolean;
  fileInputGallery: React.RefObject<HTMLInputElement | null>;
  onCloseStatisticsModal: () => void;
  onCloseGalleryDrawer: () => void;
  onAddGallery: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGallery: (publicId: string) => void;
}

interface ModalsProps {
  showStatisticsModal: boolean;
  showGalleryDrawer: boolean;
  businessData: BusinessCollection;
  reviews: Review[];
  loading: boolean;
  fileInputGallery: React.RefObject<HTMLInputElement | null>;
  onCloseStatisticsModal: () => void;
  onCloseGalleryDrawer: () => void;
  onAddGallery: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGallery: (publicId: string) => void;
}

const Modals: React.FC<ModalsProps> = ({
  showStatisticsModal,
  showGalleryDrawer,
  businessData,
  reviews,
  loading,
  fileInputGallery,
  onCloseStatisticsModal,
  onCloseGalleryDrawer,
  onAddGallery,
  onRemoveGallery,
}) => {
  return (
    <>
      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault();
            if (e.target === e.currentTarget) {
              onCloseStatisticsModal();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 h-[80vh] overflow-y-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Business Insights
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onCloseStatisticsModal();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {businessData.stats?.totalViews || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Total Views
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  All time
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    {businessData.stats?.totalLikes || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Total Likes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  All time
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">
                    {businessData.stats?.averageRating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Average Rating
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {businessData.stats?.totalRatings || 0} ratings
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {businessData.stats?.totalFeedbacks || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Total Feedback
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Customer messages
                </p>
              </div>
            </div>

            {/* Monthly Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">
                    {businessData.stats?.monthlyViews || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  This Month Views
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Current month activity
                </p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600">
                    {reviews.length}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Reviews
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total received
                </p>
              </div>
            </div>

            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                Detailed Analytics Coming Soon
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                We're working on comprehensive business insights for you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Drawer */}
      {showGalleryDrawer && (
        <div 
          className="fixed inset-0 backdrop-filter backdrop-blur-sm bg-opacity-20 flex justify-end z-50"
          onClick={(e) => {
            e.preventDefault();
            if (e.target === e.currentTarget) {
              onCloseGalleryDrawer();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md h-full overflow-y-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Gallery
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onCloseGalleryDrawer();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {businessData.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {businessData.gallery.map((imageId, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden relative group"
                    >
                      <ImageDisplay
                        publicId={imageId}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveGallery(imageId);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    No Images Yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add images to showcase your business.
                  </p>
                </div>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputGallery.current?.click();
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full justify-center disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Images
                </button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputGallery}
                  onChange={onAddGallery}
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
