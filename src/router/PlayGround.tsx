import { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import AuthLayout from "@/layouts/AuthLayout";
import AuthRouter from "./AuthRouter";
import GuestLayout from "@/layouts/GuestLayout";
import GuestRouter from "./GuestRouter";
import { ToastContainer } from "react-toastify";
import { auth } from "@/firebase";
import NeighbourLinkLoader from "@/components/common/NeighbourLinkLoader";


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
        return <NeighbourLinkLoader/>;
    }

    return (
        <Router>
            <Suspense fallback={<NeighbourLinkLoader />}>
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