import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import { FaArrowRight, FaUserCircle, FaMapMarkerAlt } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { checkIfUserRegisteredInVolunteer } from "@/utils/communities/CheckIfRegisterd";
import { calculateDistance } from "@/utils/utils";
import { getOrCreateConversationWithUser } from "@/services/messagingService";
import { Slider } from "@/components/ui/slider";

// Define the filter type
interface FilterState {
  search: string;
  showLocalOnly: boolean;
  distance: number; 
}

const VolunteerList = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]); // Store all fetched volunteers
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    search: "",
    showLocalOnly: false,
    distance: 5, // Default to 5km
  });
  const navigate = useNavigate();
  const { user } = useStateContext();
  const [currentUserLocation, setCurrentUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const isRegistered = checkIfUserRegisteredInVolunteer();

  const getCurrentUser = async () => {
    const q = query(collection(db, "Users"), where("email", "==", user?.email));
    const currentUser = (await getDocs(q)).docs.map((doc) => doc.data())[0];
    return currentUser;
  };

  const [isActiveVolunteer, setIsActiveVolunteer] = useState(false);

  const changeActiveVolunteer = async (checked: boolean) => {
    const q = query(
      collection(db, "volunteer"),
      where("email", "==", user?.email)
    );
    const snapshot = await getDocs(q);
    const volunteerDoc = snapshot.docs[0];
    const docRef = doc(db, "volunteer", volunteerDoc.id);
    await updateDoc(docRef, {
      isActiveVolunteer: checked,
    });
  };

  useEffect(() => {
    async function run() {
      const isRegis = await isRegistered;
      if (isRegis) {
        const q = query(
          collection(db, "volunteer"),
          where("email", "==", user?.email)
        );
        const volunteerDoc = (await getDocs(q)).docs[0];
        if (volunteerDoc) {
          setIsActiveVolunteer(volunteerDoc.data().isActiveVolunteer);
        } else {
          setIsActiveVolunteer(false);
        }
      } else {
        setIsActiveVolunteer(false);
      }
    }

    run();
  }, []);

  const handleActiveChange = async (checked: boolean) => {
    setIsActiveVolunteer(checked);

    const isRegis = await isRegistered;

    if (!isRegis && !checked) return false;

    if (!isRegis) {
      const currentUser = await getCurrentUser();
      const volunteerData = {
        email: user?.email,
        photoURL: user?.photoURL,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
        address: currentUser?.address,
        location: currentUser?.location,
        isActiveVolunteer: true,
        userId: user?.uid,
      };
      await addDoc(collection(db, "volunteer"), volunteerData);
    } else {
      changeActiveVolunteer(checked);
    }
  };

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "volunteer"));
        const volunteersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentUser = await getCurrentUser();
        const currentUserLocation = currentUser?.location;
        setCurrentUserLocation(currentUserLocation);

        // Store all volunteers
        setAllVolunteers(volunteersData);

        // Filter volunteers based on distance and other criteria
        filterVolunteers(volunteersData, currentUserLocation, filter.distance);
      } catch (error) {
        console.error("Error fetching volunteers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  // Function to filter volunteers based on distance
  const filterVolunteers = (volunteers: any[], userLocation: any, maxDistance: number) => {
    if (!userLocation) return setVolunteers([]);

    const filtered = volunteers.filter((volunteer) => {
      const { latitude, longitude } = volunteer.location || {};
      
      // Skip if volunteer has no location data
      if (!latitude || !longitude) return false;
      
      // Calculate distance
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        latitude,
        longitude
      );

      return (
        volunteer.isActiveVolunteer &&
        distance <= maxDistance &&
        volunteer.email !== user?.email
      );
    });

    setVolunteers(filtered);
  };

  // Re-filter when distance changes
  useEffect(() => {
    if (currentUserLocation && allVolunteers.length > 0) {
      filterVolunteers(allVolunteers, currentUserLocation, filter.distance);
    }
  }, [filter.distance, currentUserLocation, allVolunteers]);

  // Handle distance change
  const handleDistanceChange = (value: number[]) => {
    setFilter(prev => ({ ...prev, distance: value[0] }));
  };

  const filteredVolunteers = volunteers.filter((volunteer) => {
    if (volunteer.email === user?.email) return false;

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const name = `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase();
      const address = volunteer.address?.toLowerCase() || "";

      if (!name.includes(searchLower) && !address.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const handleContactVolunteer = async (volunteer: any) => {
    if (!user?.uid || !volunteer.id) return;

    try {
      setLoading(true);
      const userQuery = query(
        collection(db, "Users"),
        where("email", "==", volunteer.email)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        console.error("User not found for email:", volunteer.email);
        return;
      }

      const volunteerProviderId = userSnapshot.docs[0].id;

      const conversationId = await getOrCreateConversationWithUser(
        user.uid,
        volunteerProviderId
      );

      if (conversationId) {
        console.log("Navigating to conversation:", conversationId);

        navigate(`/messages/${conversationId}`);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center p-10">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-transparent border-t-blue-600 border-b-blue-600 dark:border-t-blue-400 dark:border-b-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading volunteers...
          </p>
        </div>
      </div>
    );

  // Volunteer toggle section - extracted as a reusable fragment
  const volunteerToggleSection = (
    <>
      <div className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Are you willing to Volunteer
      </div>
      <div className="flex items-center gap-2 p-3">
        <label
          htmlFor="isActive"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Not Active
        </label>
        <Switch
          id="isActive"
          checked={isActiveVolunteer}
          onCheckedChange={handleActiveChange}
        />
        <label
          htmlFor="isActive"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Active
        </label>
      </div>
    </>
  );

  // Distance filter section - extracted as a reusable fragment
  const distanceFilterSection = (
    <div className="px-4 py-3 bg-white rounded-lg shadow-sm dark:bg-gray-800 mb-4 border border-gray-100 dark:border-gray-700">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Distance: {filter.distance} km
        </label>
        <Slider
          value={[filter.distance]}
          onValueChange={handleDistanceChange}
          max={20}
          min={1}
          step={1}
          className="w-full"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>1 km</span>
        <span>20 km</span>
      </div>
    </div>
  );

  if (volunteers.length === 0)
    return (
      <>
        {volunteerToggleSection}
        {distanceFilterSection}
        <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <FaUserCircle className="w-12 h-12 text-blue-500 dark:text-blue-300" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No volunteers found within {filter.distance} km
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try increasing the distance or be the first to register as a volunteer! Your help could make a big
            difference in your community.
          </p>
        </div>
      </>
    );

  return (
    <>
      {volunteerToggleSection}
      {distanceFilterSection}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {filteredVolunteers.length > 0 ? (
          filteredVolunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              {/* Header with gradient and avatar */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-900 p-5 text-white relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>

                <div className="flex items-center space-x-3 relative">
                  <div className="bg-white dark:bg-gray-200 p-1 rounded-full shadow-md">
                    {volunteer.photoURL ? (
                      <img
                        src={volunteer.photoURL}
                        alt={`${volunteer.firstName} ${volunteer.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-3xl text-green-600 dark:text-green-700" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {volunteer.firstName} {volunteer.lastName}
                    </h2>
                    <p className="text-green-100 dark:text-green-200 text-sm flex items-center">
                      <FaMapMarkerAlt className="mr-1" />
                      {volunteer.address || "Location not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Volunteer details */}
              <div className="p-5 dark:bg-gray-800">
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {volunteer.email}
                    </p>
                    {volunteer.phone && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-medium">Phone:</span>{" "}
                        {volunteer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional volunteer info would go here */}

                {/* Contact Button */}
                <button
                  onClick={() => handleContactVolunteer(volunteer)}
                  className="w-full py-2.5 border border-teal-600 bg-gradient-to-r hover:text-white text-green-700 dark:bg-gradient-to-r dark:from-green-700 dark:to-teal-800 dark:text-white rounded-lg font-medium shadow-md hover:from-green-700 hover:to-teal-700 dark:hover:from-green-800 dark:hover:to-teal-900 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <span>Message Now</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-full">
                <svg
                  className="w-12 h-12 text-green-500 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
              No volunteers match your search
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your search criteria or invite others to join as
              volunteers.
            </p>
            <button
              onClick={() =>
                window.navigator.clipboard.writeText(window.location.href)
              }
              className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium shadow-sm transition-all border border-gray-200 dark:border-gray-600"
            >
              Copy Invite Link
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default VolunteerList;
