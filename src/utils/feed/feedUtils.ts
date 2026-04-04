import { FeedItem } from "@/pages/components/Feed";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { calculateDistance } from "@/utils/utils";

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Get current user's location from their profile
const getCurrentUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("No authenticated user found");
      return null;
    }

    const userDoc = await getDoc(doc(db, "Users", user.uid));
    if (userDoc.exists() && userDoc.data().location) {
      const location = userDoc.data().location;
      return {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
      };
    } else {
      console.log("User profile or location data not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user location:", error);
    return null;
  }
};

export const processFeedItem = async (items: FeedItem[], userRadius?: number) => {
  console.log("🔍 Processing feed items:", items.length);
  console.log("📏 User radius filter:", userRadius);
  
  // Get current user's location for radius filtering
  const userLocation = await getCurrentUserLocation();
  console.log("📍 User location:", userLocation);

  // Filter feed items based on duration and radius
  const filteredItems = items?.filter(feedItem => {
    // Duration filtering (existing logic)
    const createdAt = new Date(feedItem.createdAt).getTime();
    const durationInDays = parseInt(feedItem.duration);
    const durationInMs = durationInDays * 24 * 60 * 60 * 1000; 
    const timeDiff = Date.now() - createdAt;
    
    // Check if item is still valid by duration
    const isValidByDuration = timeDiff < durationInMs;
    if (!isValidByDuration) {
      feedItem.createdAt = new Date().toISOString();
      console.log(`⏰ Item ${feedItem.id} was expired and has been reassigned to today`);
    }

    // Location/radius filtering
    if (!userLocation) {
      console.log(`🌍 No user location available - including item ${feedItem.id}`);
      return true;
    }

    if (!feedItem.location) {
      console.log(`📍 Item ${feedItem.id} has no location data - including by default`);
      return true;
    }

    try {
      // Calculate distance between user and feed item
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        feedItem.location.latitude,
        feedItem.location.longitude
      );

      // Use userRadius if provided, otherwise fall back to feed item's visibilityRadius
      let radiusToUse: number;
      if (userRadius !== undefined) {
        radiusToUse = userRadius;
        console.log(`📏 Using user radius: ${radiusToUse}km for item ${feedItem.id}`);
      } else {
        // Convert visibilityRadius from string to number
        const visibilityRadiusKm = parseFloat(feedItem.visibilityRadius);
        
        if (isNaN(visibilityRadiusKm)) {
          console.log(`⚠️ Item ${feedItem.id} has invalid radius: "${feedItem.visibilityRadius}" - including by default`);
          return true;
        }
        radiusToUse = visibilityRadiusKm;
        console.log(`📏 Using item radius: ${radiusToUse}km for item ${feedItem.id}`);
      }

      const isWithinRadius = distance <= radiusToUse;
      
      console.log(`📏 Item ${feedItem.id}: distance=${distance.toFixed(2)}km, radius=${radiusToUse}km, included=${isWithinRadius ? '✅' : '❌'}`);
      
      return isWithinRadius;
    } catch (error) {
      console.error(`❌ Error calculating distance for item ${feedItem.id}:`, error);
      // On error, include the item to avoid breaking the feed
      return true;
    }
  });

  console.log(`🎯 Filtered ${items.length} items to ${filteredItems.length} items`);
  console.log(`📊 Filtering summary:
    - Total items: ${items.length}
    - Filtered items: ${filteredItems.length}
    - User has location: ${userLocation ? '✅' : '❌'}
    - User radius filter: ${userRadius ? `${userRadius}km` : 'Not applied (using item radius)'}
    - Items with location: ${items.filter(item => item.location).length}
    - Items without location: ${items.filter(item => !item.location).length}
  `);
  
  return filteredItems;
}