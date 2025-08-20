import React from 'react';
import { Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';
import { BusinessCollection } from '../types';
import WarningCard from './WarningCard';
import ModernProductForm from './ModernProductForm';
import Modal from './Modal';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';

interface ProductsSectionProps {
  businessData: BusinessCollection;
  editingProduct: string | null;
  tempProduct: BusinessCollection['products'][0] | null;
  isServicesProductsIncomplete: () => boolean;
  isCoreProfileComplete: () => boolean;
  promotingItemId: string | null;
  removingPromotionId: string | null;
  onAddProduct: () => void;
  onEditProduct: (product: BusinessCollection['products'][0]) => void;
  onSaveProduct: (product?: BusinessCollection['products'][0]) => void;
  onCancelProduct: () => void;
  onRemoveProduct: (id: string) => void;
  onPromoteItem: (itemId: string, type: 'product') => void;
  onRemovePromotion: (itemId: string, type: 'product') => void;
  isItemPromoted: (itemId: string, type: 'product') => boolean;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({
  businessData,
  editingProduct,
  tempProduct,
  isServicesProductsIncomplete,
  isCoreProfileComplete,
  promotingItemId,
  removingPromotionId,
  onAddProduct,
  onEditProduct,
  onSaveProduct,
  onCancelProduct,
  onRemoveProduct,
  onPromoteItem,
  onRemovePromotion,
  isItemPromoted,
}) => {
  const isNewProduct = editingProduct && !businessData.products.some((p) => p.id === editingProduct);

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-8 w-1 bg-orange-600 rounded-full mr-3"></div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            Products
          </h3>
        </div>
        <button
          onClick={onAddProduct}
          disabled={!isCoreProfileComplete()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
            isCoreProfileComplete()
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isCoreProfileComplete() ? 'Complete your business profile first' : ''}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {!isCoreProfileComplete() && (
        <WarningCard
          title="Complete Your Business Profile"
          message="You need to complete your business profile (add contact info, address, images, and description) before you can add products."
          actionText="Complete Profile"
          onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
        />
      )}

      {businessData.products.length === 0 && isServicesProductsIncomplete() && isCoreProfileComplete() && (
        <WarningCard
          title="No Products Added"
          message="Add your products to showcase what you sell."
          actionText="Add Product"
          onAction={onAddProduct}
          icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessData.products.map((product) => {
          const isPromoted = isItemPromoted(product.id, 'product');
          
          return (
            <div key={product.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-white">
                    {product.name}
                  </h4>
                  {isPromoted && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Promoted
                    </span>
                  )}
                </div>
                {product.imageUrl && product.imageUrl.length > 0 && product.imageUrl.map((img,index)=>(
                  <ImageDisplay
                    publicId={img}
                    key={index}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                ))}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {product.description || 'No description available'}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="font-semibold text-green-600">₹{product.price || 'N/A'}</span>
                  <span>Stock: {product.stock || 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditProduct(product)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => onRemoveProduct(product.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                  {isPromoted ? (
                    <button
                      onClick={() => onRemovePromotion(product.id, 'product')}
                      disabled={removingPromotionId === product.id}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors disabled:opacity-50"
                    >
                      {removingPromotionId === product.id ? 'Removing...' : 'Remove Promotion'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onPromoteItem(product.id, 'product')}
                      disabled={promotingItemId === product.id}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {promotingItemId === product.id ? 'Promoting...' : 'Promote'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Adding/Editing Product */}
      <Modal
        isOpen={!!(editingProduct || isNewProduct) && !!tempProduct}
        onClose={onCancelProduct}
        title={isNewProduct ? 'Add New Product' : 'Edit Product'}
        size="xl"
      >
        {tempProduct && (
          <ModernProductForm
            product={tempProduct}
            isNew={!!isNewProduct}
            onSave={onSaveProduct}
            onCancel={onCancelProduct}
            loading={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProductsSection;
