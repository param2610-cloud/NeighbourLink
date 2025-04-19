import { getPreSignedUrl } from "@/utils/aws/aws";
import { useEffect, useState } from "react";
import { GrResources } from "react-icons/gr";

import {
  Home,
  User,
  Inbox,
  Archive,
  HeartHandshake,
  HandHeart,
  Calendar,
  MessageSquare,
  Newspaper,
  Share, // Import an appropriate icon for updates
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import ThemeToggle from "@/components/common/ThemeToggle";

interface SidebarProps {
  handleLogout: () => void;
  isSidebarOpen: boolean;
}

const Sidebar = ({ handleLogout, isSidebarOpen }: SidebarProps) => {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [activePage, setActivePage] = useState("/home");
  const [userDetails, setUserDetails] = useState<any>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            console.log("No such document!");
          }
        }
      });
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Get current path and set active page
    setActivePage(window.location.pathname);

    const fetchProfilePhoto = async () => {
      if (userDetails?.photo) {
        let photoUrl = await getPreSignedUrl(userDetails.photo);
        if (photoUrl) {
          setProfilePhoto(photoUrl);
        }
      }
    };
    fetchProfilePhoto();
  }, [userDetails]);

  const navItems = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/profileCard", label: "Profile", icon: <User size={18} /> },
    { path: "/messages", label: "Messages", icon: <MessageSquare size={18} /> },
    { path: "/updates", label: "Updates", icon: <Newspaper size={18} /> },
    // {
    //   path: "/saved/posts",
    //   label: "Saved Posts",
    //   icon: <AiOutlineHeart size={18} />,
    // },
    // {
    //   path: "/resource/offer",
    //   label: "Share Resources",
    //   icon: <Share size={18} />,
    // },
    {
      path: "/events",
      label: "Community Events",
      icon: <Calendar size={18} />,
    },
    // {
    //   path: "/profile/auth/requests",
    //   label: "My Requests",
    //   icon: <Inbox size={18} />,
    // },
    // {
    //   path: "/profile/auth/shared-resources",
    //   label: "My Resources",
    //   icon: <Archive size={18} />,
    // },
    {
      path: "/auth/posts",
      label: "My Posts",
      icon: <GrResources size={18} />,
    },
    {
      path: "/skillHome",
      label: "Skill Sharing",
      icon: <HeartHandshake size={18} />,
    },
    {
      path: "/volunteer",
      label: "Volunteer",
      icon: <HandHeart  size={18} />,
    },
  ];

  return (
    <aside
      className={`w-full md:w-64 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 fixed md:fixed transform transition-transform duration-200 ease-in-out z-50
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={
                  profilePhoto
                    ? profilePhoto
                    : "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 dark:border-indigo-400"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {userDetails?.firstName} {userDetails?.lastName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-grow overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <div
                  onClick={() => navigate(item.path)}
                  className={`flex items-center hover:cursor-pointer px-3 py-2.5 rounded-lg font-medium text-sm transition-colors group ${
                    activePage === item.path
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      activePage === item.path
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </span>
            <ThemeToggle />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
