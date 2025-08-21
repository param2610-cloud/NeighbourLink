import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { FaStore } from "react-icons/fa";
import {
  Star,
  Phone,
  CreditCard,
  QrCode,
  ArrowLeft,
  MapPin,
  MessageCircle,
  Clock,
  Package,
  Shield,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { toast } from "react-toastify";

interface Review {
  id: string;
  title: string;
  body: string;
  reviewerName: string;
  date: string;
  rating: number;
  reviewerAvatar?: string;
}

interface BusinessCollection {
  id: string;
  businessName: string;
  businessBio: string;
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDocUrl?: string;
  businessType: string;
  createdAt?: Date;

  contact: {
    phone: string;
    verified: boolean;
  };
  gallery: string[];
  businessProfileImage: string;
  coverImage: string;
  deliverySupport: boolean;
  paymentSupport?: {
    mode?: "upi" | "bank" | null;
    upi?: {
      qrCodeUrl?: string;
    };
    bank?: {
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  services: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: string;
    imageUrl?: string[];
  }[];

  products: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string[];
  }[];

  faq?: {
    question: string;
    answer: string;
  }[];

  promotedItems?: {
    serviceIds: string[];
    productIds: string[];
  };
}

const StarRating: React.FC<{ rating: number; className?: string }> = ({
  rating,
  className = "",
}) => {
  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

const BusinessViewPage: React.FC = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [businessData, setBusinessData] = useState<BusinessCollection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);

  // Sample reviews data - replace with actual reviews from Firebase
  const reviews: Review[] = [
    {
      id: "1",
      title: "Great Service",
      body: "Excellent quality and fast delivery. The team was professional and the results exceeded my expectations.",
      reviewerName: "John Doe",
      date: "2024-01-15",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "2",
      title: "Satisfied Customer",
      body: "Good value for money. Quick response time and quality work.",
      reviewerName: "Jane Smith",
      date: "2024-01-10",
      rating: 4,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "3",
      title: "Recommended",
      body: "Will definitely come back. Great customer service and attention to detail.",
      reviewerName: "Mike Johnson",
      date: "2024-01-05",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
  ];

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        if (!businessId) {
          setError("Business ID is required");
          return;
        }

        // First try to get business by document ID
        let businessDoc = await getDoc(doc(db, "business", businessId));

        if (!businessDoc.exists()) {
          // If not found by ID, try to find by owner ID
          const businessQuery = query(
            collection(db, "business"),
            where("ownerId", "==", businessId)
          );
          const businessSnapshot = await getDocs(businessQuery);

          if (!businessSnapshot.empty) {
            businessDoc = businessSnapshot.docs[0];
          } else {
            setError("Business not found");
            return;
          }
        }

        const business = {
          id: businessDoc.id,
          ...businessDoc.data(),
        } as BusinessCollection;

        setBusinessData(business);
        setError(null);
      } catch (err) {
        setError("Failed to load business data. Please try again.");
        console.error("Error fetching business data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessId]);

  const handleContactBusiness = () => {
    if (businessData?.contact?.phone) {
      window.open(`tel:${businessData.contact.phone}`, "_self");
    } else {
      toast.info("Phone number not available");
    }
  };

  const handleViewQRCode = () => {
    if (businessData?.paymentSupport?.mode === "upi" && businessData?.paymentSupport?.upi?.qrCodeUrl) {
      setShowQrModal(true);
    } else {
      toast.info("QR Code not available");
    }
  };

  const getPaymentInfo = () => {
    const payment = businessData?.paymentSupport;
    if (!payment || !payment.mode) return "Cash only";
    
    if (payment.mode === "upi") {
      return "UPI + Cash";
    } else if (payment.mode === "bank") {
      return "Bank Transfer + Cash";
    }
    return "Cash only";
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate px-4">
            {businessData.businessName}
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm mb-6 overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-32 sm:h-48 md:h-64">
            {businessData.coverImage ? (
              <ImageDisplay
                publicId={businessData.coverImage}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <FaStore className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 opacity-80" />
                  <span className="text-lg md:text-xl font-semibold">
                    {businessData.businessName}
                  </span>
                </div>
              </div>
            )}

            {/* Verification Badge */}
            {businessData.isVerified && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Verified</span>
                  <span className="sm:hidden">✓</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <div className="relative flex-shrink-0 -mt-8 sm:-mt-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl border-4 border-white dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-700">
                  {businessData.businessProfileImage ? (
                    <ImageDisplay
                      publicId={businessData.businessProfileImage}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-600">
                      <FaStore className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-0 sm:pt-4">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {businessData.businessName}
                </h2>

                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {businessData.location?.address || "Location not set"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={Number(calculateAverageRating())}
                      className="gap-1"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {calculateAverageRating()} ({reviews.length} reviews)
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed line-clamp-3">
                  {businessData.businessBio ||
                    "Welcome to our business! We're here to serve you with quality products and services."}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">
                  {(businessData.products?.length || 0) +
                    (businessData.services?.length || 0)}
                </div>
                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  Items
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">
                  {reviews.length}
                </div>
                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  Reviews
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                  {businessData.deliverySupport ? "✓" : "—"}
                </div>
                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  Delivery
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">
                  {businessData.gallery?.length || 0}
                </div>
                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  Photos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Get in Touch
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 truncate">
                      {businessData.contact?.phone || "Not provided"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {getPaymentInfo()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContactBusiness}
                  disabled={!businessData.contact?.phone}
                  className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm md:text-base font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Business
                </button>
                {businessData.paymentSupport?.mode === "upi" && businessData.paymentSupport?.upi?.qrCodeUrl && (
                  <button
                    onClick={handleViewQRCode}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm md:text-base font-medium"
                  >
                    <QrCode className="w-5 h-5" />
                    View QR Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        {businessData.paymentSupport?.mode === "bank" && businessData.paymentSupport?.bank && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Bank Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Holder Name
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    {businessData.paymentSupport.bank.accountHolderName}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 font-mono">
                    {businessData.paymentSupport.bank.accountNumber}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IFSC Code
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 font-mono">
                    {businessData.paymentSupport.bank.ifscCode}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Name
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    {businessData.paymentSupport.bank.bankName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Section */}
        {businessData.services && businessData.services.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="h-6 md:h-8 w-1 bg-green-600 rounded-full mr-3"></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                Our Services
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {businessData.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {service.imageUrl && service.imageUrl.length > 0 && (
                    <div className="h-32 md:h-40 overflow-hidden">
                      <ImageDisplay
                        publicId={service.imageUrl[0]}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-4 md:p-5">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                      {service.name}
                    </h4>

                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {service.price && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                          <CreditCard className="w-3 h-3" />₹{service.price}
                        </span>
                      )}
                      {service.duration && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                          <Clock className="w-3 h-3" />
                          {service.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {businessData.products && businessData.products.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="h-6 md:h-8 w-1 bg-orange-600 rounded-full mr-3"></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                Our Products
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {businessData.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {product.imageUrl && product.imageUrl.length > 0 && (
                    <div className="h-32 md:h-40 overflow-hidden">
                      <ImageDisplay
                        publicId={product.imageUrl[0]}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-4 md:p-5">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                      {product.name}
                    </h4>

                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {product.price && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                          <CreditCard className="w-3 h-3" />₹{product.price}
                        </span>
                      )}
                      {product.stock !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                          <Package className="w-3 h-3" />
                          {product.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {businessData.gallery && businessData.gallery.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="h-6 md:h-8 w-1 bg-purple-600 rounded-full mr-3"></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                Gallery
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {businessData.gallery.slice(0, 10).map((imageId, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-all hover:scale-105"
                  onClick={() => {
                    setCurrentGalleryIndex(index);
                    setShowGalleryModal(true);
                  }}
                >
                  <ImageDisplay
                    publicId={imageId}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {businessData.gallery.length > 10 && (
                <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <div className="text-center">
                    <span className="text-lg md:text-xl font-bold text-gray-600 dark:text-gray-300">
                      +{businessData.gallery.length - 10}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      more
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-6">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="h-6 md:h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Customer Reviews
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} className="gap-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm md:text-base">
                  {review.title}
                </h4>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {review.body}
                </p>

                <div className="flex items-center gap-2">
                  <img
                    src={review.reviewerAvatar || "/api/placeholder/32/32"}
                    alt={review.reviewerName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {review.reviewerName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGalleryModal && businessData.gallery && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl max-h-full">
            <button
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-white text-xl md:text-2xl z-10 bg-black/50 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>

            <div className="flex items-center justify-center h-full">
              <ImageDisplay
                publicId={businessData.gallery[currentGalleryIndex]}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {businessData.gallery.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentGalleryIndex(
                      (prev) =>
                        (prev - 1 + businessData.gallery.length) %
                        businessData.gallery.length
                    )
                  }
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white text-xl md:text-2xl bg-black/50 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setCurrentGalleryIndex(
                      (prev) => (prev + 1) % businessData.gallery.length
                    )
                  }
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white text-xl md:text-2xl bg-black/50 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  →
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentGalleryIndex + 1} / {businessData.gallery.length}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && businessData?.paymentSupport?.mode === "upi" && businessData?.paymentSupport?.upi?.qrCodeUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
            >
              ×
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                UPI Payment QR Code
              </h3>
              
              <div className="bg-white p-4 rounded-lg shadow-md inline-block">
                <ImageDisplay
                  publicId={businessData.paymentSupport.upi.qrCodeUrl}
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Scan this QR code with any UPI app to make payment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessViewPage;
