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
  Newspaper,
  LogOut,
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
    { path: "/", label: "Home", icon: <Home size={16} /> },
    { path: "/profileCard", label: "Profile", icon: <User size={16} /> },
    { path: "/messages", label: "Messages", icon: <MessageSquare size={16} /> },
    { path: "/updates", label: "Updates", icon: <Newspaper size={16} /> },
    { path: "/business", label: "Business", icon: <FaStore size={16} /> },
    {
      path: "/events",
      label: "Community Events",
      icon: <Calendar size={16} />,
    },
    {
      path: "/auth/posts",
      label: "My Posts",
      icon: <GrResources size={16} />,
    },
    {
      path: "/skillHome",
      label: "Skill Sharing",
      icon: <HeartHandshake size={16} />,
    },
    {
      path: "/volunteer",
      label: "Volunteer",
      icon: <HandHeart size={16} />,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {}}
        />
      )}
      
      <aside
        className={`w-64 h-screen bg-gradient-to-b from-violet-50 to-violet-100 dark:bg-gradient-to-b dark:from-gray-900 dark:to-violet-950/30 border-r border-violet-200 dark:border-gray-800 fixed transform transition-transform z-50 shadow-lg
          ${
            isSidebarOpen 
              ? "translate-x-0" 
              : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-4 border-b border-violet-200 dark:border-violet-800">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {profilePhoto ? (
                  <ImageDisplay
                    publicId={profilePhoto}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-violet-800 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-200 dark:bg-violet-700 flex items-center justify-center">
                    <User size={16} className="text-violet-600 dark:text-violet-300" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-violet-900"></div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-violet-800 dark:text-violet-200 truncate">
                  {userDetails?.firstName} {userDetails?.lastName}
                </span>
                <span className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">Online</span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex-grow py-3 px-2 overflow-hidden">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <div
                    onClick={() => navigate(item.path)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
                      ${
                        activePage === item.path
                          ? "bg-violet-200 dark:bg-violet-800/50 text-violet-800 dark:text-violet-200 shadow-sm"
                          : "text-violet-700 dark:text-violet-300 hover:bg-violet-150 dark:hover:bg-violet-800/30 hover:text-violet-900 dark:hover:text-violet-100"
                      }`}
                  >
                    <span
                      className={`mr-2 ${
                        activePage === item.path
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-violet-600 dark:text-violet-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-violet-200 dark:border-violet-800 space-y-2">
            <div className="p-2 rounded-md bg-violet-100 dark:bg-violet-800/30">
              <GoogleTranslate />
            </div>
            
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-violet-100 dark:bg-violet-800/30">
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Theme
              </span>
              <ThemeToggle />
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2
                text-violet-700 dark:text-violet-300 hover:text-red-600 dark:hover:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                text-sm font-medium rounded-md 
                transition-all duration-200
                border border-violet-300 dark:border-violet-600 hover:border-red-200 dark:hover:border-red-800"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;