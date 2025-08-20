import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { toast } from 'react-toastify';
import { BusinessCollection, PromotionFormData } from '../types';
import { 
  uploadFileToCloudinary, 
  deleteFromCloudinary, 
  createUniqueFileName 
} from '@/utils/cloudinary/cloudinary';

export const useBusinessLogic = () => {
  const [businessData, setBusinessData] = useState<BusinessCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showGalleryDrawer, setShowGalleryDrawer] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const [promotingItemId, setPromotingItemId] = useState<string | null>(null);
  const [removingPromotionId, setRemovingPromotionId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const fileInputProfile = useRef<HTMLInputElement>(null);
  const fileInputCover = useRef<HTMLInputElement>(null);
  const fileInputGallery = useRef<HTMLInputElement>(null);

  const [editingBasic, setEditingBasic] = useState(false);
  const [tempBasic, setTempBasic] = useState({
    businessName: "",
    businessBio: "",
    address: "",
    latitude: 0,
    longitude: 0,
    deliverySupport: false,
  });

  const [editingContact, setEditingContact] = useState(false);
  const [tempContact, setTempContact] = useState({
    phone: "",
    accountDetails: "",
  });

  const [editingLocation, setEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    latitude: 0,
    longitude: 0,
    address: "",
  });

  const [editingService, setEditingService] = useState<string | null>(null);
  const [tempService, setTempService] = useState<BusinessCollection["services"][0] | null>(null);

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [tempProduct, setTempProduct] = useState<BusinessCollection["products"][0] | null>(null);

  // Utility functions
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

  const checkCoreProfileFields = (business: BusinessCollection): string[] => {
    const incomplete: string[] = [];
    if (!business.contact?.phone) incomplete.push("Phone number");
    if (!business.location?.address) incomplete.push("Business address");
    if (!business.location?.latitude || !business.location?.longitude)
      incomplete.push("Location coordinates");
    if (!business.businessProfileImage)
      incomplete.push("Business profile image");
    if (!business.coverImage) incomplete.push("Cover image");
    if (!business.businessBio) incomplete.push("Business description");
    return incomplete;
  };

  const isProfileComplete = () => incompleteFields.length === 0;
  const isCoreProfileComplete = () => businessData ? checkCoreProfileFields(businessData).length === 0 : false;
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

  const isItemPromoted = (itemId: string, type: "product" | "service") => {
    if (!businessData?.promotedItems) return false;
    if (type === "service") {
      return businessData.promotedItems.serviceIds?.includes(itemId) || false;
    } else {
      return businessData.promotedItems.productIds?.includes(itemId) || false;
    }
  };

  // Initialize data
  useEffect(() => {
    const fetchUserAndBusinessData = async () => {
      try {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            const userDocRef = doc(db, "Users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
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
              } else {
                navigate("/profileCard?activetab=business");
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

  // Update temp data when business data changes
  useEffect(() => {
    if (businessData) {
      setTempBasic({
        businessName: businessData.businessName,
        businessBio: businessData.businessBio,
        address: businessData.location.address,
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        deliverySupport: businessData.deliverySupport,
      });
      setTempContact({
        phone: businessData.contact.phone,
        accountDetails: businessData.paymentSupport?.accountDetails || "",
      });
      setIncompleteFields(checkIncompleteFields(businessData));
    }
  }, [businessData]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleViewInsights = () => setShowStatisticsModal(true);
  const handleViewGallery = () => setShowGalleryDrawer(true);

  const handleChangeProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !businessData) return;
    const file = e.target.files[0];
    setLoading(true);
    try {
      const publicId = await uploadFileToCloudinary(
        file,
        createUniqueFileName(file.name)
      );
      if (businessData.businessProfileImage) {
        await deleteFromCloudinary(businessData.businessProfileImage);
      }
      await updateDoc(doc(db, "business", businessData.id), {
        businessProfileImage: publicId,
      });
      const newData = { ...businessData, businessProfileImage: publicId };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !businessData) return;
    const file = e.target.files[0];
    setLoading(true);
    try {
      const publicId = await uploadFileToCloudinary(
        file,
        createUniqueFileName(file.name)
      );
      if (businessData.coverImage) {
        await deleteFromCloudinary(businessData.coverImage);
      }
      await updateDoc(doc(db, "business", businessData.id), {
        coverImage: publicId,
      });
      const newData = { ...businessData, coverImage: publicId };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
    } catch (error) {
      console.error("Error uploading cover image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !businessData) return;
    setLoading(true);
    try {
      const files = Array.from(e.target.files);
      const publicIds = await Promise.all(
        files.map((file) =>
          uploadFileToCloudinary(file, createUniqueFileName(file.name))
        )
      );
      const newGallery = [...businessData.gallery, ...publicIds];
      await updateDoc(doc(db, "business", businessData.id), {
        gallery: newGallery,
      });
      setBusinessData({ ...businessData, gallery: newGallery });
      
      // Reset the file input to allow selecting the same files again
      if (e.target) {
        e.target.value = '';
      }
    } catch (error) {
      console.error("Error adding gallery images:", error);
      toast.error("Failed to add gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGallery = async (publicId: string) => {
    if (!businessData) return;
    setLoading(true);
    try {
      await deleteFromCloudinary(publicId);
      const newGallery = businessData.gallery.filter((g) => g !== publicId);
      await updateDoc(doc(db, "business", businessData.id), {
        gallery: newGallery,
      });
      setBusinessData({ ...businessData, gallery: newGallery });
      toast.success("Image removed successfully");
    } catch (error) {
      console.error("Error removing gallery image:", error);
      toast.error("Failed to remove image");
    } finally {
      setLoading(false);
    }
  };

  // Basic info handlers
  const handleSaveBasic = async () => {
    if (!businessData) return;
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        businessName: tempBasic.businessName,
        businessBio: tempBasic.businessBio,
        location: {
          address: tempBasic.address,
          latitude: tempBasic.latitude,
          longitude: tempBasic.longitude,
        },
        deliverySupport: tempBasic.deliverySupport,
      };
      await updateDoc(doc(db, "business", businessData.id), updatedData);
      const newData = { ...businessData, ...updatedData };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingBasic(false);
    } catch (error) {
      console.error("Error saving basic info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBasic = () => {
    if (businessData) {
      setTempBasic({
        businessName: businessData.businessName,
        businessBio: businessData.businessBio,
        address: businessData.location.address,
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        deliverySupport: businessData.deliverySupport,
      });
    }
    setEditingBasic(false);
  };

  // Contact info handlers
  const handleSaveContact = async () => {
    if (!businessData) return;
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        contact: {
          ...businessData.contact,
          phone: tempContact.phone,
        },
        paymentSupport: {
          ...businessData.paymentSupport,
          accountDetails: tempContact.accountDetails,
        },
      };
      await updateDoc(doc(db, "business", businessData.id), updatedData);
      const newData = { ...businessData, ...updatedData };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingContact(false);
    } catch (error) {
      console.error("Error saving contact info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContact = () => {
    if (businessData) {
      setTempContact({
        phone: businessData.contact.phone,
        accountDetails: businessData.paymentSupport?.accountDetails || "",
      });
    }
    setEditingContact(false);
  };

  // Location handlers
  const handleSaveLocation = async () => {
    if (!businessData) return;
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        location: {
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
          address: tempLocation.address,
        },
      };
      await updateDoc(doc(db, "business", businessData.id), updatedData);
      const newData = { ...businessData, ...updatedData };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingLocation(false);
      toast.success("Business location updated successfully!");
    } catch (error) {
      console.error("Error saving location info:", error);
      toast.error("Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLocation = () => {
    if (businessData?.location) {
      setTempLocation({
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        address: businessData.location.address,
      });
    }
    setEditingLocation(false);
  };

  // Service handlers
  const handleAddService = () => {
    if (!isCoreProfileComplete()) {
      const missingFields = businessData ? checkCoreProfileFields(businessData) : [];
      toast.error(
        `Please complete your business profile first. Missing: ${missingFields.join(', ')}`
      );
      return;
    }

    const newId = Date.now().toString();
    setTempService({
      id: newId,
      name: "",
      description: "",
      price: 0,
      duration: "",
      imageUrl: [],
    });
    setEditingService(newId);
  };

  const handleEditService = (service: BusinessCollection["services"][0]) => {
    setTempService(service);
    setEditingService(service.id);
  };

  const handleSaveService = async (serviceData?: BusinessCollection['services'][0]) => {
    if (!businessData) return;
    
    // Use provided serviceData or fallback to tempService for backward compatibility
    const serviceToSave = serviceData || tempService;
    if (!serviceToSave) return;
    
    setLoading(true);
    try {
      let newServices = businessData.services;
      const isNew = !businessData.services.some((s) => s.id === serviceToSave.id);
      if (isNew) {
        newServices = [...newServices, serviceToSave];
      } else {
        newServices = newServices.map((s) =>
          s.id === serviceToSave.id ? serviceToSave : s
        );
      }
      await updateDoc(doc(db, "business", businessData.id), {
        services: newServices,
      });
      const newData = { ...businessData, services: newServices };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingService(null);
      setTempService(null);
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelService = () => {
    setEditingService(null);
    setTempService(null);
  };

  const handleRemoveService = async (id: string) => {
    if (
      !businessData ||
      !confirm("Are you sure you want to remove this service?")
    )
      return;
    setLoading(true);
    try {
      const serviceToRemove = businessData.services.find((s) => s.id === id);
      if (serviceToRemove?.imageUrl) {
        await Promise.all(serviceToRemove.imageUrl.map(deleteFromCloudinary));
      }
      const newServices = businessData.services.filter((s) => s.id !== id);
      await updateDoc(doc(db, "business", businessData.id), {
        services: newServices,
      });
      const newData = { ...businessData, services: newServices };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      if (editingService === id) {
        setEditingService(null);
        setTempService(null);
      }
    } catch (error) {
      console.error("Error removing service:", error);
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const handleAddProduct = () => {
    if (!isCoreProfileComplete()) {
      const missingFields = businessData ? checkCoreProfileFields(businessData) : [];
      toast.error(
        `Please complete your business profile first. Missing: ${missingFields.join(', ')}`
      );
      return;
    }

    const newId = Date.now().toString();
    setTempProduct({
      id: newId,
      name: "",
      description: "",
      price: 0,
      stock: 0,
      imageUrl: [],
    });
    setEditingProduct(newId);
  };

  const handleEditProduct = (product: BusinessCollection["products"][0]) => {
    setTempProduct(product);
    setEditingProduct(product.id);
  };

  const handleSaveProduct = async (productData?: BusinessCollection['products'][0]) => {
    if (!businessData) return;
    
    // Use provided productData or fallback to tempProduct for backward compatibility
    const productToSave = productData || tempProduct;
    if (!productToSave) return;
    
    setLoading(true);
    try {
      let newProducts = businessData.products;
      const isNew = !businessData.products.some((p) => p.id === productToSave.id);
      if (isNew) {
        newProducts = [...newProducts, productToSave];
      } else {
        newProducts = newProducts.map((p) =>
          p.id === productToSave.id ? productToSave : p
        );
      }
      await updateDoc(doc(db, "business", businessData.id), {
        products: newProducts,
      });
      const newData = { ...businessData, products: newProducts };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingProduct(null);
      setTempProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProduct = () => {
    setEditingProduct(null);
    setTempProduct(null);
  };

  const handleRemoveProduct = async (id: string) => {
    if (
      !businessData ||
      !confirm("Are you sure you want to remove this product?")
    )
      return;
    setLoading(true);
    try {
      const productToRemove = businessData.products.find((p) => p.id === id);
      if (productToRemove?.imageUrl) {
        await Promise.all(productToRemove.imageUrl.map(deleteFromCloudinary));
      }
      const newProducts = businessData.products.filter((p) => p.id !== id);
      await updateDoc(doc(db, "business", businessData.id), {
        products: newProducts,
      });
      const newData = { ...businessData, products: newProducts };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      if (editingProduct === id) {
        setEditingProduct(null);
        setTempProduct(null);
      }
    } catch (error) {
      console.error("Error removing product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Promotion handlers
  const handlePromoteItem = async (
    itemId: string,
    type: "product" | "service"
  ) => {
    if (!isProfileComplete()) {
      toast.error("Please complete your profile first");
      return;
    }

    if (!auth.currentUser || !businessData) {
      toast.error("Please log in to create promotions");
      return;
    }

    if (isItemPromoted(itemId, type)) {
      toast.info("This item is already promoted");
      return;
    }

    setPromotingItemId(itemId);
    try {
      const item =
        type === "product"
          ? businessData.products.find((p) => p.id === itemId)
          : businessData.services.find((s) => s.id === itemId);

      if (!item) {
        toast.error("Item not found");
        return;
      }

      const promotionData: PromotionFormData & {
        userId: string;
        createdAt: Date;
        type: string;
        useProfileLocation: boolean;
        businessId: string;
        itemId: string;
        itemType: "product" | "service";
      } = {
        title: `${type === "product" ? "Product" : "Service"}: ${item.name}`,
        description:
          item.description ||
          `Check out our ${item.name}. ${
            type === "product" && item.price ? `Price: ₹${item.price}` : ""
          }${
            type === "service" && item.price
              ? `Starting from ₹${item.price}`
              : ""
          }`,
        contactInfo: {
          name: businessData.contact?.phone
            ? `${businessData.businessName}`
            : businessData.businessName,
          contact: businessData.contact?.phone || "",
          email: businessData.paymentSupport?.accountDetails || "",
        },
        location: {
          latitude: businessData.location?.latitude || 0,
          longitude: businessData.location?.longitude || 0,
          address: businessData.location?.address || "",
        },
        visibilityRadius: "10",
        images: item.imageUrl || [],
        videoUrl: "",
        duration: "30",
        isPromoted: true,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        type: "promotion",
        useProfileLocation: true,
        businessId: businessData.id,
        itemId: itemId,
        itemType: type,
      };

      const docRef = await addDoc(collection(db, "promotions"), promotionData);

      const currentPromotedItems = businessData.promotedItems || {
        serviceIds: [],
        productIds: [],
      };

      const updatedPromotedItems = {
        serviceIds:
          type === "service"
            ? [...currentPromotedItems.serviceIds, itemId]
            : currentPromotedItems.serviceIds,
        productIds:
          type === "product"
            ? [...currentPromotedItems.productIds, itemId]
            : currentPromotedItems.productIds,
      };

      await updateDoc(doc(db, "business", businessData.id), {
        promotedItems: updatedPromotedItems,
      });

      setBusinessData({
        ...businessData,
        promotedItems: updatedPromotedItems,
      });

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} promoted successfully!`
      );
      navigate(`/promotion/${docRef.id}`);
    } catch (error) {
      console.error("Error creating promotion:", error);
      toast.error("Failed to create promotion");
    } finally {
      setPromotingItemId(null);
    }
  };

  const handleRemovePromotion = async (
    itemId: string,
    type: "product" | "service"
  ) => {
    if (!auth.currentUser || !businessData) {
      toast.error("Please log in to remove promotions");
      return;
    }

    if (!confirm("Are you sure you want to remove this promotion?")) {
      return;
    }

    setRemovingPromotionId(itemId);
    try {
      const promotionsQuery = query(
        collection(db, "promotions"),
        where("businessId", "==", businessData.id),
        where("itemId", "==", itemId),
        where("itemType", "==", type)
      );

      const promotionsSnapshot = await getDocs(promotionsQuery);

      if (!promotionsSnapshot.empty) {
        const deletePromises = promotionsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
      }

      const currentPromotedItems = businessData.promotedItems || {
        serviceIds: [],
        productIds: [],
      };

      const updatedPromotedItems = {
        serviceIds:
          type === "service"
            ? currentPromotedItems.serviceIds.filter((id) => id !== itemId)
            : currentPromotedItems.serviceIds,
        productIds:
          type === "product"
            ? currentPromotedItems.productIds.filter((id) => id !== itemId)
            : currentPromotedItems.productIds,
      };

      await updateDoc(doc(db, "business", businessData.id), {
        promotedItems: updatedPromotedItems,
      });

      setBusinessData({
        ...businessData,
        promotedItems: updatedPromotedItems,
      });

      toast.success(
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } promotion removed successfully!`
      );
    } catch (error) {
      console.error("Error removing promotion:", error);
      toast.error("Failed to remove promotion");
    } finally {
      setRemovingPromotionId(null);
    }
  };

  return {
    // State
    businessData,
    loading,
    error,
    isSidebarOpen,
    showStatisticsModal,
    showGalleryDrawer,
    incompleteFields,
    promotingItemId,
    removingPromotionId,
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
    setTempService,
    
    // Products
    handleAddProduct,
    handleEditProduct,
    handleSaveProduct,
    handleCancelProduct,
    handleRemoveProduct,
    setTempProduct,
    
    // Promotions
    handlePromoteItem,
    handleRemovePromotion,
  };
};
