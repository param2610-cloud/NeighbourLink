import { Navigate, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { auth } from "../firebase";
import Home from '@/pages/Home';
import MessagesList from '@/components/messaging/MessagesList';
import ChatDetail from '@/components/messaging/ChatDetail';
import LandingPage from '@/components/landingPage/LandingPage';
import EmergencyPosts from '@/pages/EmergencyPosts';
import SavedPosts from '@/components/post/SavedPosts';
import NewPostForm from '@/components/Forms/NewPostForm';
import NewPostModalExample from '@/components/Examples/NewPostModalExample';

// const Profile = lazy(() => import('@/components/authPage/Profile'));
const ProfileCard = lazy(() => import('@/components/ProfileCard/ProfileCard'));
// const ResourceForm = lazy(() => import('@/components/Forms/ResourceForm'));
// const LandingPage = lazy(() => import('@/components/landingpage/LandingPage'));
const UserRequests = lazy(() => import('@/components/PostCard/UserRequests'));
const UserSharedResources = lazy(() => import('@/components/PostCard/UserSharedResources'));
const SearchPage = lazy(() => import('@/components/search/SearchPage'));
const PostDetailsPage = lazy(() => import('@/components/post/PostDetailsPage'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AuthRouter: React.FC = () => {
  const [, setUser] = useState<any>();
  
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  });

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/profileCard" element={<ProfileCard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/post" element={<NewPostModalExample />} />
        {/* <Route path="/resource/need" element={<ResourceForm userId={user?.uid}/>} /> */}
        <Route path="/post/:id" element={<PostDetailsPage/>} />
        <Route path='/profile/auth/requests' element={<UserRequests/>} />
        <Route path='/profile/auth/shared-resources' element={<UserSharedResources/>} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/messages/:conversationId" element={<ChatDetail />} />
        <Route path='/emergency/posts' element={<EmergencyPosts/>}/>
        <Route path='/saved/posts' element={<SavedPosts/>}/>
        <Route path='/register' element={<Navigate to="/"/>}/>
        <Route path='/login' element={<Navigate to="/"/>}/>
      </Routes>
    </Suspense>
  );
};

export default AuthRouter;