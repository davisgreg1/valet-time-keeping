import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        try {
          // First check if user is an admin
          const adminRef = doc(db, "admins", user.uid);
          const adminDoc = await getDoc(adminRef);

          if (adminDoc.exists()) {
            // User is an admin - always active
            setUserProfile(adminDoc.data());
            setIsActive(true);
          } else {
            // Check if user is a valet
            const valetRef = doc(db, "valets", user.uid);
            const valetDoc = await getDoc(valetRef);

            if (valetDoc.exists()) {
              // User is a valet - check if active
              const valetData = valetDoc.data();
              setUserProfile(valetData);
              setIsActive(valetData.isActive !== false); // Default to true if not set

              // If valet is deactivated, sign them out
              if (valetData.isActive === false) {
                await auth.signOut();
                setUser(null);
                setUserProfile(null);
                setIsActive(false);
                return;
              }
            } else {
              // User exists in Firebase Auth but not in valets or admins collection
              // This might be a newly created user or an error condition
              setUserProfile(null);
              setIsActive(false);
              // Don't automatically sign out - let the login page handle this
            }
          }
        } catch (error) {
          console.error("Error checking user status:", error);
          setIsActive(true); // Default to active on error to prevent lockout
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsActive(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading, isActive };
};
