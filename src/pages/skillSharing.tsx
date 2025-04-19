import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { GiHamburgerMenu } from "react-icons/gi";
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import SkillSharingForm from "../components/communities/skillSharing/SkillSharingForm";
import SkillList from "../components/communities/skillSharing/SkillList";

const SkillSharing: React.FC = () => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  return (
    <>
      {userDetails ? (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Responsive Sidebar - with Skill Sharing active */}
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
            {/* Top Navigation - Only NeighbourLink header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
              <div className="flex items-center justify-between p-4">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={toggleSidebar}
                >
                  <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                </div>

                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-blue-800 dark:text-blue-700">
                    Neighbour
                  </h1>
                    <h1 className="text-xl font-bold text-violet-800 dark:text-violet-700">
                    Link
                    </h1>
                    <span className="text-xl font-bold text-gray-700 dark:text-gray-400 mx-1">|</span>
                    <h1 className="text-xl font-bold text-green-800 dark:text-green-500">
                    Skill Sharing
                    </h1>
                </div>

                <div className="w-8 h-8"> 
                  {/* Empty div for layout balance */}
                </div>
              </div>
            </div>

            {/* Skill Sharing Content */}
            <div className="flex-1 px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Skill Sharing
                </h2>
                <button
                  onClick={toggleForm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Share Your Skills
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  About Skill Sharing
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect with neighbors who have skills to share or learn from. Whether you're a professional 
                  seeking to help others or someone looking to learn new skills, this is the place to connect.
                </p>
              </div>

              {/* Skill Sharing Form */}
              {isFormOpen && <SkillSharingForm isOpen={isFormOpen} />}

              {/* Skills List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Available Skilled Personnel in Your Community
                </h3>
                
                {/* Render SkillList component instead of loading message */}
                <SkillList />
              </div>

            </div>

            {/* Bottom Navigation */}
            <Bottombar />
          </div>
        </div>
      ) : (
        <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-600" />
        </div>
      )}
    </>
  );
};

export default SkillSharing;