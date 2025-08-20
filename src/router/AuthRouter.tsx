import { Navigate, Route, Routes } from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { auth } from "../firebase";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRealtimeNotification } from "@/utils/notification/NotificationHook";
import { useStateContext } from "@/contexts/StateContext";

import Home from "@/pages/Home";
import MessagesList from "@/components/messaging/MessagesList";
import ChatDetail from "@/components/messaging/ChatDetail";
import LandingPage from "@/components/landingPage/LandingPage";
import EmergencyPosts from "@/pages/EmergencyPosts";
import SavedPosts from "@/components/post/SavedPosts";
import SkillList from "@/components/communities/skillSharing/SkillList";
import SkillSharingForm from "@/components/communities/skillSharing/SkillSharingForm";
import SkillHome from "@/pages/skillSharing";
import VolunteerShow from "@/pages/VolunteerShow";
import { useNotification } from "@/utils/notification/NotificationHook";
import NotificationPage from "@/components/notificationPage/NotificationPage";
import AuthPosts from "@/pages/AuthPosts";
import NotFoundPage from "@/pages/NotFoundPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailsPage from "@/components/events/EventDetailsPage";
import UpdatePage from "@/components/update/SpecificUpdatePage";
import NewUpdateForm from "@/components/update/UpdateFormSingleComponent";
import UpdatesPage from "@/components/update/UpdatesFeedPage";
import NeighbourLinkLoader from "@/components/common/NeighbourLinkLoader";
import PromotionDetailsPage from "@/components/promotion/PromotionDetailsPage";
import NeighbourLinkBusiness from "@/components/bussiness/NeighbourLinkBusinessModular";
import BusinessViewPage from "@/components/bussiness/BusinessViewPage";

const ProfileCard = lazy(() => import("@/components/ProfileCard/ProfileCard"));
const ResourceForm = lazy(() => import("@/components/Forms/ResourceForm"));
const UserRequests = lazy(() => import("@/components/PostCard/UserRequests"));
const UserSharedResources = lazy(
  () => import("@/components/PostCard/UserSharedResources")
);
const SearchPage = lazy(() => import("@/components/search/SearchPage"));
const PostDetailsPage = lazy(() => import("@/components/post/PostDetailsPage"));
const ResourceDetailsPage = lazy(
  () => import("@/components/resource/ResourceDetailsPage")
);

const AuthRouter: React.FC = () => {
  const [user, setUser] = useState<any>();
  const { user: contextUser } = useStateContext();

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  });

  useNotification();

  // Add real-time notification listener with Sonner toast
  const { notification } = useRealtimeNotification(contextUser?.uid || "");

  useEffect(() => {
    if (notification) {
      toast(notification.title, {
        description: notification.description,
        action: {
          label: "View",
          onClick: () => (window.location.href = notification.action_url),
        },
      });

      // Add the notification ID to shown notifications in localStorage
      const shown = JSON.parse(
        localStorage.getItem("shown_notifications") || "[]"
      );
      if (!shown.includes(notification.id)) {
        shown.push(notification.id);
        localStorage.setItem("shown_notifications", JSON.stringify(shown));
      }
    }
  }, [notification]);

  return (
    <>
      <Toaster position="top-center" />
      <Suspense fallback={<NeighbourLinkLoader />}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/profileCard" element={<ProfileCard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/skill-share" element={<SkillList />} />
          <Route
            path="/skills-sharing-register"
            element={<SkillSharingForm isOpen={true} />}
          />
          <Route path="/event/:id" element={<EventDetailsPage />} />
          <Route path="/promotion/:id" element={<PromotionDetailsPage />} />
          <Route
            path="/resource/offer"
            element={<ResourceForm userId={user?.uid} />}
          />
          <Route
            path="/resource/need"
            element={<ResourceForm userId={user?.uid} />}
          />
          <Route path="/post/:id" element={<PostDetailsPage />} />
          <Route path="/resource/:id" element={<ResourceDetailsPage />} />
          <Route path="/profile/auth/requests" element={<UserRequests />} />
          <Route path="/auth/posts" element={<AuthPosts />} />
          <Route
            path="/profile/auth/shared-resources"
            element={<UserSharedResources />}
          />
          <Route path="/skillHome" element={<SkillHome />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/volunteer" element={<VolunteerShow />} />
          <Route path="/messages" element={<MessagesList />} />
          <Route path="/messages/:conversationId" element={<ChatDetail />} />
          <Route path="/emergency/posts" element={<EmergencyPosts />} />
          <Route path="/saved/posts" element={<SavedPosts />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/update/:id" element={<UpdatePage />} />
          <Route path="/update/new" element={<NewUpdateForm />} />
          <Route path="/register" element={<Navigate to="/" />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/business" element={<NeighbourLinkBusiness />} />
          <Route
            path="/business/view/:businessId"
            element={<BusinessViewPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AuthRouter;
