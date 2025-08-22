import React, { useState, useEffect } from 'react';
import { MapPin, Star, X, Check, Loader2 } from 'lucide-react';
import { Pandel } from '../../interface/main';

interface CreatePandalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPandal: Pandel) => void;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  category: 'traditional' | 'modern' | 'heritage' | 'community';
  coordinates: {
    lat: number;
    lng: number;
  };
}

const CreatePandalForm: React.FC<CreatePandalFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    category: 'traditional',
    coordinates: { lat: 0, lng: 0 }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Clear form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        address: '',
        category: 'traditional',
        coordinates: { lat: 0, lng: 0 }
      });
      setLocationError(null);
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      setFormData(prev => ({
        ...prev,
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      }));

      // Get address from coordinates (reverse geocoding)
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=YOUR_API_KEY`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]) {
            setFormData(prev => ({
              ...prev,
              address: data.results[0].formatted
            }));
          }
        }
      } catch (geocodeError) {
        // Silently fail geocoding - user can enter address manually
        console.warn('Geocoding failed:', geocodeError);
      }

    } catch (error: any) {
      setLocationError(error.message || 'Unable to get your location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.address.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
      setSubmitError('Please set the location for your pandal');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Generate a unique ID (timestamp-based)
      const newId = Date.now();
      
      // Create the pandal object matching the backend schema
      const newPandal: Partial<Pandel> = {
        id: newId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        category: formData.category,
        coordinates: formData.coordinates,
        average_rating: 0,
        popularity: 1, // New pandals start with low popularity
        banner_image: 'l47920220926121122', // Default banner
        avatar_image: '', // Empty initially
        images: [], // Empty initially
        reviews: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Call the backend API
      const response = await fetch('http://127.0.0.1:8001/pandel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPandal),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create pandal');
      }

      const createdPandal = await response.json();
      
      setSubmitSuccess(true);
      
      // Wait a bit to show success message, then call onSuccess
      setTimeout(() => {
        onSuccess(createdPandal);
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating pandal:', error);
      setSubmitError(error.message || 'Failed to create pandal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create New Pandal</h2>
              <p className="text-orange-100 text-sm mt-1">Add your pandal to PujoGuide</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pandal Created Successfully!</h3>
              <p className="text-gray-600">Your pandal has been added to PujoGuide and will appear in search results.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pandal Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Pandal Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="e.g., Shree Durga Pandal"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  placeholder="Describe your pandal, its theme, special features, and what makes it unique..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="traditional">Traditional</option>
                  <option value="modern">Modern</option>
                  <option value="heritage">Heritage</option>
                  <option value="community">Community</option>
                </select>
              </div>

              {/* Location Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                
                {/* Get Current Location Button */}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || isSubmitting}
                  className="w-full mb-3 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Use Current Location
                    </>
                  )}
                </button>

                {locationError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{locationError}</p>
                  </div>
                )}

                {/* Address Input */}
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter full address..."
                  required
                  disabled={isSubmitting}
                />

                {/* Coordinates Display */}
                {(formData.coordinates.lat !== 0 || formData.coordinates.lng !== 0) && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      📍 Location set: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Pandal...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Create Pandal
                  </>
                )}
              </button>

              {/* Note */}
              <div className="text-center">
                <p className="text-gray-500 text-xs">
                  By creating a pandal, you agree to provide accurate information. 
                  Your pandal will be reviewed and may take some time to appear in search results.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePandalForm;
