import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { isAdmin, getAdminProfile } from "@/lib/adminAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isAdmin(user.uid);
        setIsAdminUser(adminStatus);

        if (adminStatus) {
          const profileResult = await getAdminProfile(user.uid);
          if (profileResult.success) {
            setAdminProfile(profileResult.data);
          }
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
  }, [user, authLoading]);

  return {
    user,
    isAdminUser,
    adminProfile,
    loading: authLoading || loading,
  };
};
