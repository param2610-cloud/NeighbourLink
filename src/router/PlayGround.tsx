import { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import AuthLayout from "@/layouts/AuthLayout";
import AuthRouter from "./AuthRouter";
import GuestLayout from "@/layouts/GuestLayout";
import GuestRouter from "./GuestRouter";
import { ToastContainer } from "react-toastify";
import { auth } from "@/firebase";
import { AiOutlineEllipsis, AiOutlineLoading3Quarters } from "react-icons/ai";

// ... other imports

function PlayGround() {
    const [loading, setLoading] = useState(true); // Add loading state
    const { user } = useStateContext();

    useEffect(() => {
        // Check if auth state is ready
        const unsubscribe = auth.onAuthStateChanged(() => {
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Show loading indicator while auth state is being determined
    if (loading) {
        <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
            <AiOutlineEllipsis className="animate-spin text-6xl text-blue-600" />
        </div>;
    }

    return (
        <Router>
            {user ? (
                <AuthLayout>
                    <Suspense fallback={<div>
                        <AiOutlineLoading3Quarters />
                    </div>}>
                        <AuthRouter />
                    </Suspense>
                </AuthLayout>
            ) : (
                <GuestLayout>
                    <Suspense fallback={<div>
                        <AiOutlineLoading3Quarters />
                    </div>}>
                        <GuestRouter />
                    </Suspense>
                </GuestLayout>
            )}
            <ToastContainer />
        </Router>
    );
}

export default PlayGround;