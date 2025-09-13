import Login from '@/components/authPage/Login';
import Register from '@/components/authPage/Register';
import AboutUs from '@/components/landingPage/AboutUs';
import CommunityGuides from '@/components/landingPage/CommunityGuidelines';
import LandingPage from '@/components/landingPage/LandingPage';
import TranslationDemo from '@/pages/TranslationDemo';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const GuestRouter: React.FC = () => {
    return (
        <Routes>
            {/* Add your guest routes here */}
            <Route index element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/community-guides" element={<CommunityGuides />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/translation-demo" element={<TranslationDemo />} />
            
            {/* Redirect unauthorized users to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default GuestRouter;