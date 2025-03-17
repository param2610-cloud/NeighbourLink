import { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import AuthLayout from "@/layouts/AuthLayout";
import AuthRouter from "./AuthRouter";
import GuestLayout from "@/layouts/GuestLayout";
import GuestRouter from "./GuestRouter";
import { ToastContainer } from "react-toastify";
import { auth } from "@/firebase";
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
        return <div>Loading...</div>;
    }

    return (
        <Router>
            {user ? (
                <AuthLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                        <AuthRouter />
                    </Suspense>
                </AuthLayout>
            ) : (
                <GuestLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                        <GuestRouter />
                    </Suspense>
                </GuestLayout>
            )}
            <ToastContainer />
        </Router>
    );
}

export default PlayGround;