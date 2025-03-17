import { getPreSignedUrl } from "@/utils/aws/aws";
import { useEffect, useState } from "react";

interface SidebarProps {
    userDetails: {
        firstName?: string;
        lastName?: string;
        photo?: string;
    };
    handleLogout: () => void;
    isSidebarOpen: boolean;
}

const Sidebar = ({ userDetails, handleLogout, isSidebarOpen }: SidebarProps) => {
    const [profilePhoto,setProfilephoto] = useState<string | null>(null)

    useEffect(()=>{
        
        const fetchProfilePhoto = async ()=>{
            if(userDetails.photo){
                let photoUrl =  await getPreSignedUrl(userDetails.photo)
                if(photoUrl){
                    setProfilephoto(photoUrl);
                }
            }
        }
        fetchProfilePhoto()
    },[userDetails])
    return (
        <>
            <div
                className={`w-full md:w-64 h-screen bg-slate-50 dark:bg-neutral-800 shadow-md p-4 fixed md:fixed transform transition-transform duration-200 ease-in-out 
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`
                }
            >
                <div className="flex items-center mb-8">
                    <img
                        src={profilePhoto ? profilePhoto: "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                    />
                    <span className="ml-3 font-semibold text-xl text-gray-700 dark:text-gray-200">
                        {userDetails?.firstName} {userDetails?.lastName}
                    </span>
                </div>
                <nav>
                    <ul>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/home">Home</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/profileCard">Profile</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white border-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="#">Friends</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/profile/rqform">Request Resource</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/profile/shareform">Share Resources</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/profile/auth/requests">My Requests</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-indigo-50 border-1 text-indigo-800 text-sm rounded-md shadow-md hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white dark:bg-neutral-700 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-indigo-500 dark:focus:ring-white">
                            <a href="/profile/auth/shared-resources">My Resources</a>
                        </li>
                    </ul>
                    <button
                        className="w-full  bottom-10 px-2 py-2 bg-red-800 text-white font-medium rounded-md shadow-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </nav>
            </div>

        </>
    )
}

export default Sidebar
