import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { isAdmin, getAdminProfile } from "@/lib/adminAuth";

export const useAdmin = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // First check if user is in the dedicated admins collection
        const adminStatus = await isAdmin(user.uid);

        if (adminStatus) {
          // User is a dedicated admin
          setIsAdminUser(true);
          const profileResult = await getAdminProfile(user.uid);
          if (profileResult.success) {
            setAdminProfile(profileResult.data);
          }
        } else if (
          userProfile &&
          userProfile.isAdmin === true &&
          userProfile.isActive !== false
        ) {
          // User is a valet who has been promoted to admin
          setIsAdminUser(true);
          setAdminProfile(userProfile);
        } else {
          // User is not an admin
          setIsAdminUser(false);
          setAdminProfile(null);
        }
      } else {
        setIsAdminUser(false);
        setAdminProfile(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, userProfile, authLoading]);

  return {
    user,
    isAdminUser,
    adminProfile,
    loading: authLoading || loading,
  };
};
