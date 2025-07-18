import { LogOut, User } from "lucide-react";
import { logOut } from "../lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Layout({ children, user, userProfile }) {
  const router = useRouter();

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
              <h1 className="text-2xl font-bold text-red-600">Vicar Parking</h1>
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
