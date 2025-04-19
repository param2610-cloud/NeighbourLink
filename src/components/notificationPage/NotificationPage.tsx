import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import Bottombar from "@/components/authPage/structures/Bottombar";
import Sidebar from "../authPage/structures/Sidebar";
import { auth } from "@/firebase";
import { useStateContext } from "@/contexts/StateContext";
import {
  fetchUserNotifications,
  NotificationItem,
} from "@/utils/notification/NotificationHook";
import { InfoIcon } from "lucide-react";
// import SkillList from "../components/communities/skillSharing/SkillList";

const NotificationPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationItem[]>([]);
  const { user } = useStateContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const notifications = await fetchUserNotifications(user?.uid || "");
      setNotification(notifications);
    }
    fetchData().then(() => {
      setLoading(false);
    });
  }, [navigate]);

  console.log("Notification data:", notification);

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
        {/* Responsive Sidebar - with Skill Sharing active */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 z-40`}
        >
          <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
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
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
            <div className="flex items-center justify-between p-4">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={toggleSidebar}
              >
                <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
              </div>

              <div className="opacity-0 w-8 h-8">
                {/* Empty div for layout balance */}
              </div>
            </div>
          </div>

          {/* Skill Sharing Content - Added pb-24 for bottom padding to prevent content from being cut off by Bottombar */}
          <div className="flex-1 px-4 py-6 mt-3">
            {/* Skills List with improved heading */}
            <div className="">
              <div className="flex items-center">
                <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Notification
                </h3>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center p-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-transparent border-t-blue-600 border-b-blue-600 dark:border-t-blue-400 dark:border-b-blue-400"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  Loading skills...
                </p>
              </div>
            </div>
          )}
          <div className="px-4 space-y-2">
            {!loading &&
              notification.map((n, index) => (
                <div
                  key={index}
                  className="bg-gray-600 items-center gap-4 border rounded-lg p-3 shadow flex"
                >
                  <div>
                    <InfoIcon size={40} className="text-2xl" />
                  </div>
                  <div key={n.id} className="">
                    <h4 className="font-semibold">{n.title}</h4>
                    <p className="text-sm text-slate-200">{n.description}</p>
                    {n.action_url && (
                      <a
                        href={n.action_url}
                        target="_blank"
                        className="text-blue-500 text-sm"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            {!loading && notification.length === 0 && (
              <p className="text-gray-500 text-sm">No new notifications</p>
            )}
          </div>

          {/* Bottom Navigation */}
          <Bottombar />
        </div>
      </div>
    </>
  );
};

export default NotificationPage;
