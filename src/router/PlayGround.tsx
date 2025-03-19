import { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import AuthLayout from "@/layouts/AuthLayout";
import AuthRouter from "./AuthRouter";
import GuestLayout from "@/layouts/GuestLayout";
import GuestRouter from "./GuestRouter";
import { ToastContainer } from "react-toastify";
import { auth } from "@/firebase";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

// const LoadingSpinner = () => (
    
// );

function PlayGround() {
    const [loading, setLoading] = useState(true);
    const { user } = useStateContext();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(() => {
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-600" />
    </div>;
    }

    return (
        <Router>
            <Suspense fallback={<div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-600" />
    </div>}>
                {user ? (
                    <AuthLayout>
                        <AuthRouter />
                    </AuthLayout>
                ) : (
                    <GuestLayout>
                        <GuestRouter />
                    </GuestLayout>
                )}
            </Suspense>
            <ToastContainer />
        </Router>
    );
}

export default PlayGround;