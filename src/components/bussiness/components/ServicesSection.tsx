import React from 'react';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { BusinessCollection } from '../types';
import WarningCard from './WarningCard';
import ModernServiceForm from './ModernServiceForm';
import Modal from './Modal';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';


interface ServicesSectionProps {
  businessData: BusinessCollection;
  editingService: string | null;
  tempService: BusinessCollection['services'][0] | null;
  isServicesProductsIncomplete: () => boolean;
  isCoreProfileComplete: () => boolean;
  promotingItemId: string | null;
  removingPromotionId: string | null;
  onAddService: () => void;
  onEditService: (service: BusinessCollection['services'][0]) => void;
  onSaveService: (service?: BusinessCollection['services'][0]) => void;
  onCancelService: () => void;
  onRemoveService: (id: string) => void;
  onPromoteItem: (itemId: string, type: 'service') => void;
  onRemovePromotion: (itemId: string, type: 'service') => void;
  isItemPromoted: (itemId: string, type: 'service') => boolean;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  businessData,
  editingService,
  tempService,
  isServicesProductsIncomplete,
  isCoreProfileComplete,
  promotingItemId,
  removingPromotionId,
  onAddService,
  onEditService,
  onSaveService,
  onCancelService,
  onRemoveService,
  onPromoteItem,
  onRemovePromotion,
  isItemPromoted,
}) => {
  const isNewService = editingService && !businessData.services.some((s) => s.id === editingService);

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            Services
          </h3>
        </div>
        <button
          onClick={onAddService}
          disabled={!isCoreProfileComplete()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
            isCoreProfileComplete()
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isCoreProfileComplete() ? 'Complete your business profile first' : ''}
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {!isCoreProfileComplete() && (
        <WarningCard
          title="Complete Your Business Profile"
          message="You need to complete your business profile (add contact info, address, images, and description) before you can add services."
          actionText="Complete Profile"
          onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          icon={<Briefcase className="w-5 h-5 text-amber-600" />}
        />
      )}

      {businessData.services.length === 0 && isServicesProductsIncomplete() && isCoreProfileComplete() && (
        <WarningCard
          title="No Services or Products Added"
          message="Add at least one service or product to complete your profile."
          actionText="Add Service"
          onAction={onAddService}
          icon={<Briefcase className="w-5 h-5 text-amber-600" />}
        />
      )}

      <div className="space-y-6">
        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessData.services.map((service) => {
            const isPromoted = isItemPromoted(service.id, 'service');
            
            return (
              <div key={service.id}>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all hover:shadow-md">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {service.name}
                      </h4>
                      {isPromoted && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Promoted
                        </span>
                      )}
                    </div>
                    {service.imageUrl && service.imageUrl.length > 0 && service.imageUrl.map((img,index)=>(
                      <ImageDisplay
                      key={index}
                        publicId={img}
                        
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    ))}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {service.description || 'No description available'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="font-semibold text-green-600">₹{service.price || 'N/A'}</span>
                      <span>{service.duration || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditService(service)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onRemoveService(service.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                      {isPromoted ? (
                        <button
                          onClick={() => onRemovePromotion(service.id, 'service')}
                          disabled={removingPromotionId === service.id}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors disabled:opacity-50"
                        >
                          {removingPromotionId === service.id ? 'Removing...' : 'Remove Promotion'}
                        </button>
                      ) : (
                        <button
                          onClick={() => onPromoteItem(service.id, 'service')}
                          disabled={promotingItemId === service.id}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          {promotingItemId === service.id ? 'Promoting...' : 'Promote'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Adding/Editing Service */}
      <Modal
        isOpen={!!(editingService || isNewService) && !!tempService}
        onClose={onCancelService}
        title={isNewService ? 'Add New Service' : 'Edit Service'}
        size="xl"
      >
        {tempService && (
          <ModernServiceForm
            service={tempService}
            isNew={!!isNewService}
            onSave={onSaveService}
            onCancel={onCancelService}
            loading={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default ServicesSection;
