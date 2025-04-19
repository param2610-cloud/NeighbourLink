import React from 'react';
import { AiOutlineHome } from 'react-icons/ai';
import { BiMessageDetail, BiSearchAlt } from 'react-icons/bi';
import { CgProfile } from 'react-icons/cg';
import { useLocation, useNavigate } from 'react-router-dom';

interface BottombarProps {
    // Define your props here
}

const Bottombar: React.FC<BottombarProps> = () => {
    const navigate= useNavigate()
    const location= useLocation();
    const currentPath= location.pathname;
    const getButtonClass = () => {
        return `${
            currentPath === '/' 
            ? "md:left-64" 
            : ""
        }`;
    };
    const getNavItemClass = (path: string) => {
        return `flex flex-col items-center ${
            currentPath === path
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-600 dark:text-gray-400"
        }`;
    };
    return (
        <>
        {/* Bottom Navigation */}
        <div className={`fixed z-50 h-16 bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md ${getButtonClass()}`}>
          <div className="flex justify-around p-3">
            <button 
              onClick={() => navigate("/")} 
              className={getNavItemClass("/")}
              
            >
              <AiOutlineHome className="text-xl" />
              <span className="text-xs mt-1">Home</span>
            </button>
            
            <button 
              onClick={() => navigate("/search")} 
              className={getNavItemClass("/search")}
            >
              <BiSearchAlt className="text-xl" />
              <span className="text-xs mt-1">Search</span>
            </button>
            
            <button 
              onClick={() => navigate("/messages")} 
              className={getNavItemClass("/messages")}
            >
              <BiMessageDetail className="text-xl" />
              <span className="text-xs mt-1">Messages</span>
            </button>
            
            <button 
              onClick={() => navigate("/profileCard")} 
              className={getNavItemClass("/profileCard")}
            >
              <CgProfile className="text-xl" />
              <span className="text-xs mt-1">Profile</span>

            </button>
          </div>
        </div>
        </>
    );
};

export default Bottombar;