import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import { FaArrowRight, FaUserCircle, FaMapMarkerAlt } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";

const VolunteerList = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useStateContext();

  const [filter, setFilter] = useState({
    search: "",
    showLocalOnly: false,
  });

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "volunteer"));
        const volunteersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setVolunteers(volunteersData);
      } catch (error) {
        console.error("Error fetching volunteers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter((volunteer) => {
    // Filter out current user
    if (volunteer.email === user?.email) return false;
    
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const name = `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase();
      const address = volunteer.address?.toLowerCase() || '';
      
      if (!name.includes(searchLower) && !address.includes(searchLower)) {
        return false;
      }
    }
    
    // Location filter would go here if you implement it
    // For now, we'll just return true for all other cases
    return true;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFilter((prev) => ({ ...prev, showLocalOnly: checked }));
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

  if (volunteers.length === 0)
    return (
      <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <FaUserCircle className="w-12 h-12 text-blue-500 dark:text-blue-300" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          No volunteers found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Be the first to register as a volunteer! Your help could make a big difference in your community.
        </p>
        <button
          onClick={() => navigate("/volunteer-register")}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition-all transform hover:-translate-y-0.5"
        >
          Register as Volunteer
        </button>
      </div>
    );

  return (
    <>
      <form className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex flex-col flex-1">
          <label
            htmlFor="search-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search Volunteers
          </label>
          <input
            id="search-filter"
            placeholder="Search by name or address..."
            value={filter.search}
            onChange={handleSearchChange}
            className="mt-1 px-2 py-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="local-switch"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            All Volunteers
          </label>
          <Switch
            id="local-switch"
            checked={filter.showLocalOnly}
            onCheckedChange={handleSwitchChange}
          />
          <label
            htmlFor="local-switch"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Local Only
          </label>
        </div>
      </form>
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
                      <span className="font-medium">Email:</span> {volunteer.email}
                    </p>
                    {volunteer.phone && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-medium">Phone:</span> {volunteer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional volunteer info would go here */}

                {/* Contact Button */}
                <button
                  onClick={() => navigate(`/volunteers/${volunteer.id}`)}
                  className="w-full py-2.5 border border-teal-600 bg-gradient-to-r hover:text-white text-green-700 dark:bg-gradient-to-r dark:from-green-700 dark:to-teal-800 dark:text-white rounded-lg font-medium shadow-md hover:from-green-700 hover:to-teal-700 dark:hover:from-green-800 dark:hover:to-teal-900 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <span>Contact Now</span>
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
              Try adjusting your search criteria or invite others to join as volunteers.
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