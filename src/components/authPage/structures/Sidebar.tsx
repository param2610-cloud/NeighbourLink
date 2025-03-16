import React from 'react'

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
    return (
        <>
            <div
                className={`w-full md:w-64 h-screen bg-white shadow-md p-4 fixed md:fixed transform transition-transform duration-200 ease-in-out 
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`
                }
            >
                <div className="flex items-center mb-8">
                    <img
                        // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
                        src="../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                    />
                    <span className="ml-3 font-semibold text-xl text-gray-700">
                        {userDetails?.firstName} {userDetails?.lastName}
                    </span>
                </div>
                <nav>
                    <ul>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <a href="/home">Home</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <a href="/profileCard">Profile</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-white text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white border-1 border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <a href="#">Friends</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                            <a href="/profile/rqform">Request Resource</a>
                        </li>
                        <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                            <a href="/profile/shareform">Share Resources</a>
                        </li>
                    </ul>
                    <button
                        className="w-full  bottom-10 px-2 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
