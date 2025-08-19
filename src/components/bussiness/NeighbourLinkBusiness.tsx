import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { GiHamburgerMenu } from "react-icons/gi";
import { BsLightningChargeFill } from "react-icons/bs";
import { FaStore } from "react-icons/fa";
import { Star, Phone, CreditCard, QrCode, Eye, Image, FileText, Crown } from 'lucide-react';
import Sidebar from "../authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { useMobileContext } from "@/contexts/MobileContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: string;
  title: string;
  body: string;
  reviewerName: string;
  date: string;
  rating: number;
  reviewerAvatar?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  isPromoted?: boolean;
}

interface BusinessInfo {
  name: string;
  location: string;
  avatar: string;
  coverImage: string;
  contact: string;
  deliveryAvailable: boolean;
  paymentModes: string[];
}

const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = "" }) => {
  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const NeighbourLinkBusiness: React.FC = () => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useMobileContext();

  // Sample data - replace with your actual data
  const businessInfo: BusinessInfo = {
    name: "XYZ Business",
    location: "Location: Kolkata, West Bengal, India",
    avatar: "/api/placeholder/48/48",
    coverImage: "/api/placeholder/300/128",
    contact: "+91 12345 67890",
    deliveryAvailable: false,
    paymentModes: ["Both cash and UPI"]
  };

  const reviews: Review[] = [
    {
      id: "1",
      title: "Review title",
      body: "Review body",
      reviewerName: "Reviewer name",
      date: "Date",
      rating: 0,
      reviewerAvatar: "/api/placeholder/24/24"
    },
    {
      id: "2",
      title: "Review title",
      body: "Review body",
      reviewerName: "Reviewer name",
      date: "Date",
      rating: 0,
      reviewerAvatar: "/api/placeholder/24/24"
    },
    {
      id: "3",
      title: "Review title",
      body: "Review body",
      reviewerName: "Reviewer name",
      date: "Date",
      rating: 0,
      reviewerAvatar: "/api/placeholder/24/24"
    }
  ];

  const products: Product[] = [
    {
      id: "1",
      name: "Spider man",
      description: "Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very short story.",
      image: "/api/placeholder/200/150",
      isPromoted: true
    },
    {
      id: "2",
      name: "Shoe",
      description: "Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very short story.",
      image: "/api/placeholder/200/150"
    },
    {
      id: "3",
      name: "Camera",
      description: "Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very short story.",
      image: "/api/placeholder/200/150"
    }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            const docRef = doc(db, "Users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
              setLoading(false);
            } else {
              navigate("/login");
              console.log("No such document!");
            }
          } else {
            navigate("/login");
          }
        });
      } catch (err) {
        setError("Failed to load user data. Please try again.");
        setLoading(false);
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [navigate]);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewAnnouncement = () => {
    console.log("New announcement clicked");
  };

  const handleViewQRCode = () => {
    console.log("View QR Code clicked");
  };

  const handleViewInsights = () => {
    console.log("View Insights clicked");
  };

  const handleViewGallery = () => {
    console.log("View Gallery clicked");
  };

  const handleViewVerificationDocument = () => {
    console.log("View Verification Document clicked");
  };

  const handleUpgradeToPremium = () => {
    console.log("Upgrade to Premium clicked");
  };

  const handlePromoteProduct = (productId: string) => {
    console.log(`Promote product ${productId} clicked`);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Responsive Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-300 z-100`}
        >
          <Sidebar
            handleLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* Overlay to close sidebar when clicking outside (only on mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <div className="md:ml-64">
          {/* Enhanced Top Navigation with animated gradient */}
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
                <span className="mx-2 text-blue-500 dark:text-gray-400">
                  |
                </span>
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

          {/* Loading content */}
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

          {/* Bottom Navigation */}
          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Responsive Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-300 z-100`}
        >
          <Sidebar
            handleLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* Overlay to close sidebar when clicking outside (only on mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <div className="md:ml-64">
          {/* Enhanced Top Navigation with animated gradient */}
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
                <span className="mx-2 text-blue-500 dark:text-gray-400">
                  |
                </span>
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

          {/* Error content */}
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>

          {/* Bottom Navigation */}
          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Responsive Sidebar - with Business active */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-300 z-100`}
        >
          <Sidebar
            handleLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* Overlay to close sidebar when clicking outside (only on mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <div className="md:ml-64">
          {/* Enhanced Top Navigation with animated gradient */}
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
                <span className="mx-2 text-blue-500 dark:text-gray-400">
                  |
                </span>
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

          {/* Business Dashboard Content - Added pb-24 for bottom padding to prevent content from being cut off by Bottombar */}
          <div className="flex-1 px-4 py-6 pb-24">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <BsLightningChargeFill className="text-yellow-300 text-2xl" />
                  <h2 className="text-3xl font-bold">Business Dashboard</h2>
                </div>

                {/* Business Profile Section */}
                <div className="flex items-center mb-6">
                  <img 
                    src={businessInfo.avatar} 
                    alt={businessInfo.name}
                    className="w-16 h-16 rounded-full border-2 border-white mr-4"
                  />
                  <div>
                    <h3 className="text-2xl font-bold">{businessInfo.name}</h3>
                    <p className="text-blue-100">{businessInfo.location}</p>
                  </div>
                </div>

                <p className="text-lg max-w-2xl mb-6 text-blue-50">
                  Manage your business presence, connect with customers, and grow your local network. 
                  Track your performance and showcase your products to the community.
                </p>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <span className="text-sm font-medium">
                      {reviews.length} Reviews
                    </span>
                  </div>
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <span className="text-sm font-medium">
                      {products.length} Products
                    </span>
                  </div>
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <span className="text-sm font-medium">
                      Delivery: {businessInfo.deliveryAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>Contact: {businessInfo.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Delivery available: {businessInfo.deliveryAvailable ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment modes: {businessInfo.paymentModes.join(', ')}</span>
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

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
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
                  <span>Your Gallery</span>
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
                  <div key={review.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                    <StarRating rating={review.rating} className="mb-2" />
                    <h4 className="font-medium text-gray-800 dark:text-white mb-1">{review.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{review.body}</p>
                    <div className="flex items-center gap-2">
                      <img 
                        src={review.reviewerAvatar || '/api/placeholder/32/32'} 
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

            {/* Product/Service Gallery */}
            <div className="mt-8 mb-16">
              <div className="flex items-center mb-6">
                <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Product/Service Gallery
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage all your products here</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-40 object-cover"
                      />
                      {product.isPromoted && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Promoted
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{product.name}</h4>
                        {!product.isPromoted && (
                          <button 
                            onClick={() => handlePromoteProduct(product.id)}
                            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            Promote
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          {isMobile && <Bottombar />}
        </div>
      </div>
    </>
  );
};

export default NeighbourLinkBusiness;