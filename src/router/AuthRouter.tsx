import { Navigate, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Profile from '@/components/authPage/Profile';
import ProfileCard from '@/components/ProfileCard/ProfileCard';

import ResourceForm from '@/components/Forms/ResourceForm';
import ResourceSharingForm from '@/components/Forms/ResourceSharingForm';
import { auth } from "../firebase";
import LandingPage from '@/components/landingpage/LandingPage';

// Import your auth-related components here
// import Login from '../pages/Login';
// import Register from '../pages/Register';
// import ForgotPassword from '../pages/ForgotPassword';

const AuthRouter: React.FC = () => {
    const [user, setUser] = useState<any>();
    useEffect(() => {
      auth.onAuthStateChanged((user) => {
        setUser(user);
      });
    });
  
    return (
        <Routes>
            {/* Add your authentication routes here */}
            <Route index element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profileCard" element={<ProfileCard />} />
            <Route path="/home" element={<LandingPage />} />
            <Route
              path="/profile/rqform"
              element={<ResourceForm userId={user?.uid} />}
            />
            <Route
              path="/profile/shareform"
              element={<ResourceSharingForm userId={user?.uid} />}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
    );
};

export default AuthRouter;