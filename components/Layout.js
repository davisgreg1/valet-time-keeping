import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Layout({ children, user, userProfile }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminRef);
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    const result = await logOut();
    if (result.success) {
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } else {
      toast.error("Failed to log out");
    }
    setIsDropdownOpen(false);
  };

  const handleAdminClick = () => {
    router.push("/admin");
    setIsDropdownOpen(false);
  };

  // Get user initials
  const getUserInitials = () => {
    if (userProfile?.fullName) {
      return userProfile.fullName
        .split(" ")
        .map((name) => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-xl sm:text-2xl font-bold text-red-600">
                  Vicar Parking
                </h1>
              </Link>
            </div>

            {user && (
              <div className="relative user-dropdown">
                {/* User Menu Trigger */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {/* User Avatar Circle */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
                    {getUserInitials()}
                  </div>

                  {/* User Name - Hidden on small screens */}
                  <div className="hidden sm:flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                      {userProfile?.fullName || user.email}
                    </span>
                    {isAdmin && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Dropdown Arrow */}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-100">
                    {/* User Info Section - Mobile Only */}
                    <div className="block sm:hidden px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {getUserInitials()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {userProfile?.fullName || user.email}
                          </p>
                          {isAdmin && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Administrator
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {isAdmin && (
                        <button
                          onClick={handleAdminClick}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-400" />
                          Admin Dashboard
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-gray-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                {/* Backdrop for mobile */}
                {/* {isDropdownOpen && (
                  <div className="fixed inset-0 z-40 bg-black opacity-50 sm:hidden" />
                )} */}
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
