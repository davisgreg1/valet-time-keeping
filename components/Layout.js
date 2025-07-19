import { useEffect } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Layout({ children, user, userProfile }) {
  const router = useRouter();

  // Continuous status monitoring for valets
  useEffect(() => {
    if (!user) return;

    const checkValetStatus = async () => {
      try {
        // Only check valet status, not admin status
        const valetRef = doc(db, "valets", user.uid);
        const valetDoc = await getDoc(valetRef);

        if (valetDoc.exists()) {
          const valetData = valetDoc.data();

          // If valet is deactivated, sign them out immediately
          if (valetData.isActive === false) {
            toast.error(
              "Your account has been deactivated. You will be signed out."
            );
            await auth.signOut();
            router.push("/auth/login");
          }
        }
      } catch (error) {
        console.error("Error checking valet status:", error);
        // Don't sign out on error to avoid disrupting legitimate users
      }
    };

    // Check status every 30 seconds for real-time enforcement
    const interval = setInterval(checkValetStatus, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user, router]);

  const handleLogout = async () => {
    const result = await logOut();
    if (result.success) {
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } else {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-red-600">
                  Vicar Parking
                </h1>
              </Link>
            </div>

            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{userProfile?.fullName || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
