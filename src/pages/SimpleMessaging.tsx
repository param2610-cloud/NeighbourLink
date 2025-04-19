import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdChatboxes } from 'react-icons/io';
import { setupFCMToken } from '../components/messaging/SetupFCMToken';
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "../components/authPage/structures/Bottombar";
import ConversationsList from '../components/messaging/ConversationsList';
import SimpleChatInterface from '../components/messaging/SimpleChatInterface';

const SimpleMessaging = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setUserDetails] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            // Get user details
            const docRef = doc(db, "Users", user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
              
              // Setup FCM token for notifications
              try {
                await setupFCMToken(user.uid);
              } catch (error) {
                console.error("Error setting up notifications:", error);
              }
            } else {
              navigate("/login");
              console.log("No such document!");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setLoading(false);
          }
        } else {
          navigate("/login");
          setLoading(false);
        }
      });
    };
    
    fetchUserData();
  }, [navigate]);
  
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };
  
  const handleBack = () => {
    setSelectedConversationId(null);
  };
  
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
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
          <AiOutlineLoading3Quarters className="animate-spin text-5xl text-blue-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-800">
            Loading Messaging...
          </h3>
          <p className="text-gray-500 mt-2">
            Please wait while we set things up...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
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
      
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Main content */}
      <div className="md:ml-64 flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
          <div className="flex items-center justify-between p-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={toggleSidebar}
            >
              <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
            </div>  

            <div className="flex items-center ">
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
                <IoMdChatboxes className="mr-1 dark:text-yellow-300 text-orange-600" />
                <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                  Messages
                </h2>
              </div>
            </div>

            <div className="opacity-0 w-8 h-8">
              {/* Empty div for layout balance */}
            </div>
          </div>
        </div>
        
        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          {selectedConversationId ? (
            <SimpleChatInterface 
              conversationId={selectedConversationId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Messages</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Connect with volunteers and neighbors</p>
              </div>
              
              <ConversationsList
                onSelectConversation={handleSelectConversation}
                className="flex-1"
              />
            </div>
          )}
        </div>
        
        {/* Bottom Navigation */}
        <Bottombar />
      </div>
    </div>
  );
};

export default SimpleMessaging;
