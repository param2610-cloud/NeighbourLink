import { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useStateContext } from "@/contexts/StateContext";
import AuthLayout from "@/layouts/AuthLayout";
import AuthRouter from "./AuthRouter";
import GuestLayout from "@/layouts/GuestLayout";
import GuestRouter from "./GuestRouter";
import { ToastContainer } from "react-toastify";
import { auth, db } from "@/firebase";
import NeighbourLinkLoader from "@/components/common/NeighbourLinkLoader";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";


function PlayGround() {
    const [loading, setLoading] = useState(true);
    const [userDocExists, setUserDocExists] = useState(false);
    const { user } = useStateContext();
    const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);

    // Effect for authentication state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setCurrentAuthUser(currentUser);
            if (!currentUser) {
                setUserDocExists(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Effect for monitoring user document - runs when auth state changes
    useEffect(() => {
        let unsubscribeDoc = () => {};

        if (currentAuthUser) {
            const userDocRef = doc(db, "Users", currentAuthUser.uid);
            
            // Initial check
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setUserDocExists(true);
                    setLoading(false);
                } else {
                    // Document doesn't exist yet, set up a listener
                    console.log("User document doesn't exist yet, waiting for creation...");
                    
                    // Set up real-time listener for document creation
                    unsubscribeDoc = onSnapshot(userDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            console.log("User document was created!");
                            setUserDocExists(true);
                            toast.success("Registration complete!", {
                                position: "top-center",
                            });
                        } else {
                            setUserDocExists(false);
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Error listening to document:", error);
                        setLoading(false);
                    });
                }
            }).catch(error => {
                console.error("Error checking document:", error);
                setLoading(false);
            });
        }

        return () => {
            if (typeof unsubscribeDoc === 'function') {
                unsubscribeDoc();
            }
        };
    }, [currentAuthUser]);

    if (loading) {
        return <NeighbourLinkLoader/>;
    }

    return (
        <Router>
            <Suspense fallback={<NeighbourLinkLoader />}>
                {user && userDocExists ? (
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