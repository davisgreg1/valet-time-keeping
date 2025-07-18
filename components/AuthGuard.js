import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AlertCircle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";

export default function AuthGuard({ children, user, requireActive = true }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      setIsAuthorized(false);
      return;
    }

    checkUserAuthorization();
  }, [user, requireActive]);

  const checkUserAuthorization = async () => {
    try {
      // Check if user is an admin first (admins are always authorized)
      const adminRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminRef);

      if (adminDoc.exists()) {
        setUserStatus({ type: "admin", data: adminDoc.data(), isActive: true });
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is a valet
      const valetRef = doc(db, "valets", user.uid);
      const valetDoc = await getDoc(valetRef);

      if (valetDoc.exists()) {
        const valetData = valetDoc.data();
        const isActive = valetData.isActive !== false;

        setUserStatus({ type: "valet", data: valetData, isActive });

        if (requireActive && !isActive) {
          // User is deactivated - sign them out and block access
          toast.error(
            "Your account has been deactivated. You will be signed out."
          );
          await auth.signOut();
          setIsAuthorized(false);
          router.push("/auth/login");
        } else {
          setIsAuthorized(true);
        }
      } else {
        // User exists in Firebase Auth but not in our system
        setUserStatus({ type: "unknown", data: null, isActive: false });
        setIsAuthorized(false);
        toast.error("Account not found in system. You will be signed out.");
        await auth.signOut();
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error checking user authorization:", error);
      // On error, deny access to be safe
      setIsAuthorized(false);
      toast.error(
        "Unable to verify account status. Please try logging in again."
      );
      await auth.signOut();
      router.push("/auth/login");
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Verifying account status...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            {userStatus?.type === "valet" && !userStatus.isActive
              ? "Your account has been deactivated. Please contact your administrator."
              : "You do not have permission to access this area. Please contact your administrator."}
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="btn-primary"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // User is authorized - render the protected content
  return children;
}
