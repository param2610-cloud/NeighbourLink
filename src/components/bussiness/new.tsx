import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { GiHamburgerMenu } from "react-icons/gi";
import { BsLightningChargeFill } from "react-icons/bs";
import { FaStore } from "react-icons/fa";
import {
  Star,
  Phone,
  CreditCard,
  QrCode,
  Eye,
  Image,
  FileText,
  Crown,
  Edit,
  X,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  AlertTriangle,
  MapPin,
  Camera,
  Briefcase,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import Sidebar from "../authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { useMobileContext } from "@/contexts/MobileContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";

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
    accountDetails?: string;
    qrCodeUrl?: string;
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
  }[];

  products: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
  }[];

  faq?: {
    question: string;
    answer: string;
  }[];
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

// Business Details Modal Component
const BusinessDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  businessData: BusinessCollection;
  onSave: (updatedData: Partial<BusinessCollection>) => void;
  incompleteFields: string[];
}> = ({ isOpen, onClose, businessData, onSave, incompleteFields }) => {
  const [formData, setFormData] = useState({
    businessName: businessData.businessName || "",
    businessBio: businessData.businessBio || "",
    phone: businessData.contact?.phone || "",
    address: businessData.location?.address || "",
    deliverySupport: businessData.deliverySupport || false,
    accountDetails: businessData.paymentSupport?.accountDetails || "",
    services: businessData.services || [],
    products: businessData.products || [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { id: Date.now().toString(), name: "", description: "", price: 0 },
      ],
    }));
  };

  const removeService = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id),
    }));
  };

  const updateService = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service) =>
        service.id === id ? { ...service, [field]: value } : service
      ),
    }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now().toString(), name: "", description: "", price: 0, stock: 0 },
      ],
    }));
  };

  const removeProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      ),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        businessName: formData.businessName,
        businessBio: formData.businessBio,
        contact: {
          ...businessData.contact,
          phone: formData.phone,
        },
        location: {
          ...businessData.location,
          address: formData.address,
        },
        deliverySupport: formData.deliverySupport,
        paymentSupport: {
          ...businessData.paymentSupport,
          accountDetails: formData.accountDetails,
        },
        services: formData.services,
        products: formData.products,
      };

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error("Error saving business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: FileText },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "products", label: "Products", icon: ShoppingBag },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Complete Business Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, businessName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.businessBio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, businessBio: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your business and what you offer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your business address"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="delivery"
                  checked={formData.deliverySupport}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deliverySupport: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="delivery"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Offer delivery services
                </label>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Account Details (Optional)
                </label>
                <input
                  type="text"
                  value={formData.accountDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accountDetails: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="UPI ID, Bank details, etc."
                />
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Services
                </h3>
                <button
                  onClick={addService}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>
              {formData.services.map((service, index) => (
                <div key={service.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Service {index + 1}
                    </span>
                    <button
                      onClick={() => removeService(service.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Service name"
                      value={service.name}
                      onChange={(e) => updateService(service.id, "name", e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={service.price || ""}
                      onChange={(e) => updateService(service.id, "price", parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <textarea
                    placeholder="Service description"
                    value={service.description || ""}
                    onChange={(e) => updateService(service.id, "description", e.target.value)}
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}
              {formData.services.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-2" />
                  <p>No services added yet. Click "Add Service" to get started.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Products
                </h3>
                <button
                  onClick={addProduct}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
              {formData.products.map((product, index) => (
                <div key={product.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product {index + 1}
                    </span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={product.price || ""}
                      onChange={(e) => updateProduct(product.id, "price", parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={product.stock || ""}
                      onChange={(e) => updateProduct(product.id, "stock", parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <textarea
                    placeholder="Product description"
                    value={product.description || ""}
                    onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}
              {formData.products.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                  <p>No products added yet. Click "Add Product" to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {incompleteFields.length > 0 && (
              <span>Missing: {incompleteFields.join(", ")}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Warning Card Component for inline warnings
const WarningCard: React.FC<{
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, message, actionText, onAction, icon }) => {
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

const NeighbourLinkBusiness: React.FC = () => {
  const [businessData, setBusinessData] = useState<BusinessCollection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showGalleryDrawer, setShowGalleryDrawer] = useState(false);
  const [showVerificationDocModal, setShowVerificationDocModal] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const [showBusinessDetailsModal, setShowBusinessDetailsModal] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useMobileContext();

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

  useEffect(() => {
    const fetchUserAndBusinessData = async () => {
      try {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            const userDocRef = doc(db, "Users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              // Fetch business data
              const businessQuery = query(
                collection(db, "business"),
                where("ownerId", "==", user.uid)
              );
              const businessSnapshot = await getDocs(businessQuery);

              if (!businessSnapshot.empty) {
                const businessDoc = businessSnapshot.docs[0];
                const business = {
                  id: businessDoc.id,
                  ...businessDoc.data(),
                } as BusinessCollection;
                setBusinessData(business);

                // Check if profile is complete
                const incomplete = checkIncompleteFields(business);
                setIncompleteFields(incomplete);
              } else {
                // No business found, redirect to create business
                navigate("/business/create");
              }

              setLoading(false);
            } else {
              navigate("/login");
            }
          } else {
            navigate("/login");
          }
        });
      } catch (err) {
        setError("Failed to load business data. Please try again.");
        setLoading(false);
        console.error("Error fetching business data:", err);
      }
    };

    fetchUserAndBusinessData();
  }, [navigate]);

  const checkIncompleteFields = (business: BusinessCollection): string[] => {
    const incomplete: string[] = [];

    if (!business.contact?.phone) incomplete.push("Phone number");
    if (!business.location?.address) incomplete.push("Business address");
    if (!business.location?.latitude || !business.location?.longitude)
      incomplete.push("Location coordinates");
    if (!business.services?.length && !business.products?.length)
      incomplete.push("At least one service or product");
    if (!business.businessProfileImage)
      incomplete.push("Business profile image");
    if (!business.coverImage) incomplete.push("Cover image");
    if (!business.businessBio) incomplete.push("Business description");

    return incomplete;
  };

  const isProfileComplete = () => {
    return incompleteFields.length === 0;
  };

  const handleNewAnnouncement = () => {
    if (!isProfileComplete()) {
      setShowBusinessDetailsModal(true);
      return;
    }
    console.log("New announcement clicked");
    // Navigate to announcement creation page
  };

  const handleEditBusinessProfile = () => {
    setShowBusinessDetailsModal(true);
  };

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  }

  const handleSaveBusinessDetails = () => { 

   }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewQRCode = () => {
    console.log("View QR Code clicked");
  };

  const handleViewInsights = () => {
    setShowStatisticsModal(true);
  };

  const handleViewGallery = () => {
    setShowGalleryDrawer(true);
  };

  const handleViewVerificationDocument = () => {
    console.log("View Verification Document clicked");
    if (businessData?.verificationDocUrl) {
      setShowVerificationDocModal(true);
    } else {
      // Show alert or toast that no verification document is available
      alert("No verification document available. Please upload a verification document when creating or editing your business profile.");
    }
  };

  const handleUpgradeToPremium = () => {
    console.log("Upgrade to Premium clicked");
  };

  const handlePromoteItem = (itemId: string, type: "product" | "service") => {
    if (!isProfileComplete()) {
      setShowBusinessDetailsModal(true);
      return;
    }
    console.log(`Promote ${type} ${itemId} clicked`);
  };

  // Helper functions to check specific incomplete fields
  const isContactIncomplete = () => !businessData?.contact?.phone;
  const isLocationIncomplete = () =>
    !businessData?.location?.address ||
    !businessData?.location?.latitude ||
    !businessData?.location?.longitude;
  const isImagesIncomplete = () =>
    !businessData?.businessProfileImage || !businessData?.coverImage;
  const isDescriptionIncomplete = () => !businessData?.businessBio;
  const isServicesProductsIncomplete = () =>
    !businessData?.services?.length && !businessData?.products?.length;

  if (loading) {
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
            <div className="flex items-center justify-between p-4">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={toggleSidebar}
              >
                <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
              </div>

              <div className="flex items-center ">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                  Neighbour
                </h1>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                  Link
                </h1>
                <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
                <div className="flex items-center">
                  <FaStore className="mr-1 dark:text-yellow-300 text-orange-600" />
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                    Business
                  </h2>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNewAnnouncement}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  New Announcement
                </button>
                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                  Inbox
                </button>
              </div>
            </div>
          </div>

          <div className="container w-full mt-8 mx-auto px-4 py-8">
            <div className="mb-8 text-center space-y-3">
              <div className="h-8 w-48 mx-auto">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="h-4 w-32 mx-auto">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  if (error) {
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
            <div className="flex items-center justify-between p-4">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={toggleSidebar}
              >
                <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
              </div>

              <div className="flex items-center ">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                  Neighbour
                </h1>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                  Link
                </h1>
                <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
                <div className="flex items-center">
                  <FaStore className="mr-1 dark:text-yellow-300 text-orange-600" />
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                    Business
                  </h2>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNewAnnouncement}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  New Announcement
                </button>
                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                  Inbox
                </button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div
              className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>

          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  return (
    <>
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
            <div className="flex items-center justify-between p-4">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={toggleSidebar}
              >
                <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
              </div>

              <div className="flex items-center ">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                  Neighbour
                </h1>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                  Link
                </h1>
                <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
                <div className="flex items-center">
                  <FaStore className="mr-1 dark:text-yellow-300 text-orange-600" />
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                    Business
                  </h2>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNewAnnouncement}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    !isProfileComplete()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  New Announcement
                </button>
                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                  Inbox
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 pb-24">
            {/* Profile Completion Banner - Only show if incomplete */}
            {!isProfileComplete() && (
              <div className="bg-gradient-to-r from-slate-700 to-slate-700 text-white rounded-lg p-4 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold">
                        Complete Your Business Profile
                      </h3>
                      <p className="text-sm opacity-90">
                        {incompleteFields.length} fields remaining - Complete to
                        unlock all features
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBusinessDetailsModal(true)}
                    className="bg-white text-orange-600 px-4 py-2 rounded hover:bg-orange-50 transition-colors font-medium"
                  >
                    Complete Now
                  </button>
                </div>
              </div>
            )}

            {/* Hero Section */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <FaStore className="text-orange-700 dark:text-yellow-300 text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Business Overview
                  </h2>
                </div>
                {!isProfileComplete() && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-600 rounded-md px-3 py-1">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Profile Incomplete
                    </span>
                  </div>
                )}
              </div>

              {businessData && (
                <>
                  <div className="flex items-center mb-6">
                    {businessData.businessProfileImage ? (
                      <ImageDisplay
                        publicId={businessData.businessProfileImage}
                        className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 mr-4 object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 mr-4 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-slate-500 text-xs">No Image</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        {businessData.businessName}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {businessData.location?.address || "Location not set"}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    {businessData.businessBio ||
                      "Manage your business presence, connect with customers, and grow your local network."}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {reviews.length}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Reviews
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {(businessData.products?.length || 0) +
                          (businessData.services?.length || 0)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Items
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {businessData.deliverySupport ? "Yes" : "No"}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Delivery
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {businessData.isVerified ? "✓" : "—"}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Verified
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Business Details Card */}
            {businessData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Business Information
                </h3>

                {/* Contact Information Warning */}
                {isContactIncomplete() && (
                  <WarningCard
                    title="Contact Information Missing"
                    message="Add your phone number so customers can reach you directly."
                    actionText="Add Phone Number"
                    onAction={() => setShowBusinessDetailsModal(true)}
                    icon={<Phone className="w-5 h-5 text-amber-600" />}
                  />
                )}

                {/* Location Information Warning */}
                {isLocationIncomplete() && (
                  <WarningCard
                    title="Business Location Missing"
                    message="Set your business address and location coordinates for better discoverability."
                    actionText="Set Location"
                    onAction={() => setShowBusinessDetailsModal(true)}
                    icon={<MapPin className="w-5 h-5 text-amber-600" />}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4" />
                      <span>
                        Contact: {businessData.contact?.phone || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          businessData.deliverySupport
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      <span>
                        Delivery available:{" "}
                        {businessData.deliverySupport ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Payment:{" "}
                        {businessData.paymentSupport?.accountDetails
                          ? "Digital + Cash"
                          : "Cash only"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleViewQRCode}
                      className="flex items-center justify-center gap-2 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Code
                    </button>
                    <button
                      onClick={handleUpgradeToPremium}
                      className="flex items-center justify-center gap-2 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade To Premium
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Images Section */}
            {businessData && isImagesIncomplete() && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Business Images
                </h3>
                <WarningCard
                  title="Business Images Missing"
                  message="Add a profile image and cover photo to make your business more attractive to customers."
                  actionText="Upload Images"
                  onAction={handleEditBusinessProfile}
                  icon={<Camera className="w-5 h-5 text-amber-600" />}
                />
              </div>
            )}

            {/* Business Description Section */}
            {businessData && isDescriptionIncomplete() && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Business Description
                </h3>
                <WarningCard
                  title="Business Description Missing"
                  message="Add a compelling description of your business to help customers understand what you offer."
                  actionText="Add Description"
                  onAction={() => setShowBusinessDetailsModal(true)}
                  icon={<FileText className="w-5 h-5 text-amber-600" />}
                />
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleViewInsights}
                  className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span>View Insights</span>
                </button>
                <button
                  onClick={handleViewGallery}
                  className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <Image className="w-5 h-5 text-green-600" />
                  <span>
                    Your Gallery ({businessData?.gallery?.length || 0})
                  </span>
                </button>
                <button
                  onClick={handleViewVerificationDocument}
                  className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>Verification Document</span>
                </button>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mt-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Statistics
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                  >
                    <StarRating rating={review.rating} className="mb-2" />
                    <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                      {review.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {review.body}
                    </p>
                    <div className="flex items-center gap-2">
                      <img
                        src={review.reviewerAvatar || "/api/placeholder/32/32"}
                        alt={review.reviewerName}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div className="font-medium">{review.reviewerName}</div>
                        <div>{review.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            {businessData?.services && businessData.services.length > 0 ? (
              <div className="mt-8 mb-8">
                <div className="flex items-center mb-6">
                  <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Services
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {businessData.services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {service.name}
                        </h4>
                        <button
                          onClick={() =>
                            handlePromoteItem(service.id, "service")
                          }
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            !isProfileComplete()
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-green-200 dark:bg-green-600 text-green-700 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-500"
                          }`}
                          disabled={!isProfileComplete()}
                        >
                          Promote
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {service.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        {service.price && <span>₹{service.price}</span>}
                        {service.duration && <span>{service.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              businessData && (
                <div className="mt-8 mb-8">
                  <div className="flex items-center mb-6">
                    <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Services
                    </h3>
                  </div>
                  <WarningCard
                    title="No Services Added"
                    message="Add your services to let customers know what you offer. This helps complete your business profile."
                    actionText="Add Services"
                    onAction={() => setShowBusinessDetailsModal(true)}
                    icon={<Briefcase className="w-5 h-5 text-amber-600" />}
                  />
                </div>
              )
            )}

            {/* Products Section */}
            {businessData?.products && businessData.products.length > 0 ? (
              <div className="mt-8 mb-8">
                <div className="flex items-center mb-6">
                  <div className="h-8 w-1 bg-orange-600 rounded-full mr-3"></div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Products
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {businessData.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {product.name}
                        </h4>
                        <button
                          onClick={() =>
                            handlePromoteItem(product.id, "product")
                          }
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            !isProfileComplete()
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-orange-200 dark:bg-orange-600 text-orange-700 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-500"
                          }`}
                          disabled={!isProfileComplete()}
                        >
                          Promote
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        {product.price && <span>₹{product.price}</span>}
                        {product.stock && <span>Stock: {product.stock}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              businessData && (
                <div className="mt-8 mb-8">
                  <div className="flex items-center mb-6">
                    <div className="h-8 w-1 bg-orange-600 rounded-full mr-3"></div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Products
                    </h3>
                  </div>
                  <WarningCard
                    title="No Products Added"
                    message="Add your products to showcase what you sell. This helps customers discover your offerings."
                    actionText="Add Products"
                    onAction={() => setShowBusinessDetailsModal(true)}
                    icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
                  />
                </div>
              )
            )}

            {/* Overall completion warning if both services and products are missing */}
            {businessData && isServicesProductsIncomplete() && (
              <div className="mt-8 mb-16">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Profile Incomplete
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    Add at least one product or service to complete your
                    business profile and unlock announcements.
                  </p>
                  <button
                    onClick={() => setShowBusinessDetailsModal(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Complete Profile Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {isMobile && <Bottombar />}
        </div>
      </div>

      {/* Business Details Modal */}
      {businessData && (
        <BusinessDetailsModal
          isOpen={showBusinessDetailsModal}
          onClose={() => setShowBusinessDetailsModal(false)}
          businessData={businessData}
          onSave={handleSaveBusinessDetails}
          incompleteFields={incompleteFields}
        />
      )}

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Business Insights
              </h3>
              <button
                onClick={() => setShowStatisticsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Placeholder for statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">0</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Total Views
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This month
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">0</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Engagement
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This month
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Gallery
                </h3>
                <button
                  onClick={() => setShowGalleryDrawer(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {businessData?.gallery && businessData.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {businessData.gallery.map((imageId, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <ImageDisplay
                        publicId={imageId}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    No Images Yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add images to showcase your business.
                  </p>
                  <button
                    onClick={handleEditBusinessProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Images
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Document Modal */}
      {showVerificationDocModal && businessData?.verificationDocUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Verification Document
                </h2>
              </div>
              <button
                onClick={() => setShowVerificationDocModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-2xl">
                  <ImageDisplay
                    publicId={businessData.verificationDocUrl}
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Business verification document
                  </p>
                  {businessData.isVerified && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Verified Business</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowVerificationDocModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NeighbourLinkBusiness;
