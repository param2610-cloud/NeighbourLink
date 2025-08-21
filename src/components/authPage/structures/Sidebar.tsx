// import { getPreSignedUrl } from "@/utils/aws/aws";
import { useEffect, useState } from "react";
import { GrResources } from "react-icons/gr";

import {
  Home,
  User,
  HeartHandshake,
  HandHeart,
  Calendar,
  MessageSquare,
  Newspaper, // Import an appropriate icon for updates
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import ThemeToggle from "@/components/common/ThemeToggle";
import GoogleTranslate from "@/components/GoogleTranslation";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { FaStore } from "react-icons/fa";

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
        setProfilePhoto(userDetails?.photo);
        
      }
    };
    fetchProfilePhoto();
  }, [userDetails]);

  const navItems = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/profileCard", label: "Profile", icon: <User size={18} /> },
    { path: "/messages", label: "Messages", icon: <MessageSquare size={18} /> },
    { path: "/updates", label: "Updates", icon: <Newspaper size={18} /> },
    { path: "/business", label: "Business", icon: <FaStore size={18} /> },
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
      icon: <HandHeart size={18} />,
    },
  ];

  return (
    <aside
      className={`w-full md:w-64 h-screen bg-gradient-to-b from-indigo-800/50 via-purple-800/30 to-black/30 backdrop-blur-md border-r border-indigo-700/15 fixed md:fixed transform transition-transform duration-300 ease-in-out z-50
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
  <div className="flex flex-col h-full">
        {/* Profile Section */}
        <div className="p-3 border-b border-indigo-800/25">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {profilePhoto && (
                <ImageDisplay
                  publicId={profilePhoto}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-yellow-300/30 shadow-sm"
                />
              )}
              {/* <img
                src={
                  profilePhoto
                    ? profilePhoto
                    : "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 dark:border-indigo-400"
              /> */}
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border-2 border-indigo-900"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white drop-shadow-sm text-sm">
                {userDetails?.firstName} {userDetails?.lastName}
              </span>
              <span className="text-[11px] text-indigo-100/80">Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-grow overflow-y-auto py-3 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <div
                  onClick={() => navigate(item.path)}
                  className={`relative flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-all duration-180 cursor-pointer group ${
                    activePage === item.path
                      ? 'bg-gradient-to-r from-indigo-500/18 via-purple-500/10 to-yellow-400/6 text-white shadow-sm ring-1 ring-indigo-500/18'
                      : 'text-indigo-200/90 hover:bg-indigo-700/8 hover:text-white'
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      activePage === item.path
                        ? 'text-yellow-300'
                        : 'text-indigo-200/70 group-hover:text-yellow-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {activePage === item.path && (
                    <span className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-l-full shadow-sm" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-indigo-800/18 space-y-2">
          <div>
            <div className="p-1 rounded-lg bg-indigo-900/14">
              <GoogleTranslate />
            </div>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded-md bg-indigo-800/14">
            <span className="text-sm font-medium text-indigo-100/90">Theme</span>
            <ThemeToggle />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 hover:from-yellow-300 hover:via-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-2xl transform-gpu transition-all duration-200 hover:scale-105 ring-2 ring-yellow-300/30"
            onClick={handleLogout}
            aria-label="Logout"
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
