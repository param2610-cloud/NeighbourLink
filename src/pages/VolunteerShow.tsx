import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { GiHamburgerMenu } from "react-icons/gi";
import { BsLightningChargeFill } from "react-icons/bs";
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import VolunteerList from "../components/communities/volunteer/VolunteerList";
import { HandHeart } from "lucide-react";

const VolunteerShow: React.FC = () => {
  const [, setUserDetails] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
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

  return (
    <>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Responsive Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 w-64 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-300 z-40`}
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
            {/* Top Navigation */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
              <div className="flex items-center justify-between p-4">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={toggleSidebar}
                >
                  <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                </div>

                <div className="flex items-center space-x-1">
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
                    <HandHeart className="mr-1 dark:text-yellow-300 text-orange-600" />
                    <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                      Volunteers
                    </h2>
                  </div>
                </div>

                <div className="opacity-0 w-8 h-8">
                  {/* Empty div for layout balance */}
                </div>
              </div>
            </div>

            {/* Content - Added pb-24 for bottom padding to prevent content from being cut off by Bottombar */}
            <div className="flex-1 px-4 py-6 pb-24">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

                <div className="z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <BsLightningChargeFill className="text-yellow-300 text-2xl" />
                    <h2 className="text-3xl font-bold">Volunteer Hub</h2>
                  </div>

                  {/* Add messaging button */}
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => navigate('/messages')}
                      className="flex items-center bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 transition-colors"
                    >
                      <span className="text-sm font-medium">My Messages</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                    </button>
                  </div>

                  <p className="text-lg max-w-2xl mb-6 text-green-50">
                    Connect with dedicated volunteers in your community. Whether
                    you need help or want to offer your time, our volunteer
                    network makes it easy to make a difference together.
                  </p>

                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                      <span className="text-sm font-medium">
                        300+ Volunteers
                      </span>
                    </div>
                    <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                      <span className="text-sm font-medium">
                        150+ Active Members
                      </span>
                    </div>
                    <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                      <span className="text-sm font-medium">
                        40+ Categories
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volunteer Directory with heading */}
              <div className="mt-8 mb-16">
                <div className="flex items-center mb-6">
                  <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Community Volunteer Directory
                  </h3>
                </div>

                {/* Render VolunteerList component */}
                <VolunteerList />
              </div>
            </div>

            {/* Bottom Navigation */}
            <Bottombar />
          </div>
        </div>
    </>
  );
};

export default VolunteerShow;
