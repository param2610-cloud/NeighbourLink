import React from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { useMobileContext } from '@/contexts/MobileContext';

import { useBusinessLogic } from './hooks/useBusinessLogic';
import BusinessHeroSection from './components/BusinessHeroSection';
import ServicesSection from './components/ServicesSection';
import ProductsSection from './components/ProductsSection';
import ContactInfoSection from './components/ContactInfoSection';
import LocationSection from './components/LocationSection';
import QuickActionsSection from './components/QuickActionsSection';
import StatisticsReviewsSection from './components/StatisticsReviewsSection';
import WarningCard from './components/WarningCard';
import Modals from './components/Modals';
import { Review } from './types';

// Import other components
import Sidebar from '../authPage/structures/Sidebar';
import Bottombar from '../authPage/structures/Bottombar';

const NeighbourLinkBusiness: React.FC = () => {
  const { isMobile } = useMobileContext();
  const {
    // State
    businessData,
    loading,
    error,
    isSidebarOpen,
    showStatisticsModal,
    showGalleryDrawer,
    editingBasic,
    tempBasic,
    editingContact,
    tempContact,
    editingLocation,
    tempLocation,
    editingService,
    tempService,
    editingProduct,
    tempProduct,
    promotingItemId,
    removingPromotionId,
    
    // Refs
    fileInputProfile,
    fileInputCover,
    fileInputGallery,
    
    // Utility functions
    isProfileComplete,
    isCoreProfileComplete,
    isContactIncomplete,
    isLocationIncomplete,
    isImagesIncomplete,
    isDescriptionIncomplete,
    isServicesProductsIncomplete,
    isItemPromoted,
    
    // Event handlers
    handleLogout,
    toggleSidebar,
    handleViewInsights,
    handleViewGallery,
    handleChangeProfile,
    handleChangeCover,
    handleAddGallery,
    handleRemoveGallery,
    
    // State setters
    setShowStatisticsModal,
    setShowGalleryDrawer,
    setEditingBasic,
    setTempBasic,
    setEditingContact,
    setTempContact,
    setEditingLocation,
    setTempLocation,
    
    // Basic info
    handleSaveBasic,
    handleCancelBasic,
    
    // Contact info
    handleSaveContact,
    handleCancelContact,
    
    // Location info
    handleSaveLocation,
    handleCancelLocation,
    
    // Services
    handleAddService,
    handleEditService,
    handleSaveService,
    handleCancelService,
    handleRemoveService,
    
    // Products
    handleAddProduct,
    handleEditProduct,
    handleSaveProduct,
    handleCancelProduct,
    handleRemoveProduct,
    
    // Promotions
    handlePromoteItem,
    handleRemovePromotion,
  } = useBusinessLogic();

  // Sample reviews data - replace with actual reviews from Firebase
  const reviews: Review[] = [
    {
      id: "1",
      title: "Great Service",
      body: "Excellent quality and fast delivery",
      reviewerName: "John Doe",
      date: "2024-01-15",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "2",
      title: "Satisfied Customer",
      body: "Good value for money",
      reviewerName: "Jane Smith",
      date: "2024-01-10",
      rating: 4,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "3",
      title: "Recommended",
      body: "Will definitely come back",
      reviewerName: "Mike Johnson",
      date: "2024-01-05",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
  ];

  const handleViewVerificationDocument = () => {
    console.log("View Verification Document clicked");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!businessData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-100`}
      >
        <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="md:ml-64">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md">
          <div className="flex items-center justify-between p-4 md:hidden">
            <button onClick={toggleSidebar}>
              <GiHamburgerMenu className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <BusinessHeroSection
            businessData={businessData}
            loading={loading}
            editingBasic={editingBasic}
            tempBasic={tempBasic}
            isProfileComplete={isProfileComplete}
            fileInputProfile={fileInputProfile}
            fileInputCover={fileInputCover}
            onChangeProfile={handleChangeProfile}
            onChangeCover={handleChangeCover}
            onEditBasic={() => setEditingBasic(true)}
            onSaveBasic={handleSaveBasic}
            onCancelBasic={handleCancelBasic}
            onTempBasicChange={(updates) => setTempBasic({ ...tempBasic, ...updates })}
          />

          {/* Services Section */}
          <ServicesSection
            businessData={businessData}
            editingService={editingService}
            tempService={tempService}
            isServicesProductsIncomplete={isServicesProductsIncomplete}
            isCoreProfileComplete={isCoreProfileComplete}
            promotingItemId={promotingItemId}
            removingPromotionId={removingPromotionId}
            onAddService={handleAddService}
            onEditService={handleEditService}
            onSaveService={handleSaveService}
            onCancelService={handleCancelService}
            onRemoveService={handleRemoveService}
            onPromoteItem={handlePromoteItem}
            onRemovePromotion={handleRemovePromotion}
            isItemPromoted={isItemPromoted}
          />

          {/* Products Section */}
          <ProductsSection
            businessData={businessData}
            editingProduct={editingProduct}
            tempProduct={tempProduct}
            isServicesProductsIncomplete={isServicesProductsIncomplete}
            isCoreProfileComplete={isCoreProfileComplete}
            promotingItemId={promotingItemId}
            removingPromotionId={removingPromotionId}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onSaveProduct={handleSaveProduct}
            onCancelProduct={handleCancelProduct}
            onRemoveProduct={handleRemoveProduct}
            onPromoteItem={handlePromoteItem}
            onRemovePromotion={handleRemovePromotion}
            isItemPromoted={isItemPromoted}
          />

          {/* Contact Information Section */}
          <ContactInfoSection
            businessData={businessData}
            editingContact={editingContact}
            tempContact={tempContact}
            loading={loading}
            isContactIncomplete={isContactIncomplete}
            onEditContact={() => setEditingContact(true)}
            onSaveContact={handleSaveContact}
            onCancelContact={handleCancelContact}
            onTempContactChange={(updates) => setTempContact({ ...tempContact, ...updates })}
          />

          {/* Location Section */}
          <LocationSection
            businessData={businessData}
            editingLocation={editingLocation}
            tempLocation={tempLocation}
            loading={loading}
            isLocationIncomplete={isLocationIncomplete}
            onEditLocation={() => setEditingLocation(true)}
            onSaveLocation={handleSaveLocation}
            onCancelLocation={handleCancelLocation}
            onTempLocationChange={(updates) => setTempLocation({ ...tempLocation, ...updates })}
          />

          {/* Business Images Section */}
          {isImagesIncomplete() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Business Images
              </h3>
              <WarningCard
                title="Business Images Missing"
                message="Add a profile image and cover photo to make your business more attractive to customers."
                actionText="Upload Images"
                onAction={() => fileInputProfile.current?.click()}
                icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              />
            </div>
          )}

          {/* Business Description Section */}
          {isDescriptionIncomplete() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Business Description
              </h3>
              <WarningCard
                title="Business Description Missing"
                message="Add a compelling description of your business to help customers understand what you offer."
                actionText="Add Description"
                onAction={() => setEditingBasic(true)}
                icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              />
            </div>
          )}

          {/* Quick Actions */}
          <QuickActionsSection
            businessData={businessData}
            onViewInsights={handleViewInsights}
            onViewGallery={handleViewGallery}
            onViewVerificationDocument={handleViewVerificationDocument}
          />

          {/* Statistics and Reviews Section */}
          <StatisticsReviewsSection reviews={reviews} />

          {/* Overall completion warning if both services and products are missing */}
          {isServicesProductsIncomplete() && (
            <div className="mt-8 mb-16">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Profile Incomplete
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  Add at least one product or service to complete your business
                  profile and unlock announcements.
                </p>
                <button
                  onClick={handleAddService}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Add Service/Product Now
                </button>
              </div>
            </div>
          )}
        </div>

        {isMobile && <Bottombar />}
      </div>

      {/* Modals */}
      <Modals
        showStatisticsModal={showStatisticsModal}
        showGalleryDrawer={showGalleryDrawer}
        businessData={businessData}
        reviews={reviews}
        loading={loading}
        fileInputGallery={fileInputGallery}
        onCloseStatisticsModal={() => setShowStatisticsModal(false)}
        onCloseGalleryDrawer={() => setShowGalleryDrawer(false)}
        onAddGallery={handleAddGallery}
        onRemoveGallery={handleRemoveGallery}
      />
    </div>
  );
};

export default NeighbourLinkBusiness;
