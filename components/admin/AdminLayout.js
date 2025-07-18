import {
  LogOut,
  Shield,
  BarChart3,
  Users,
  Activity,
  FileText,
} from "lucide-react";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
  user,
  adminProfile,
  activeTab,
  onTabChange,
}) {
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

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "valets", label: "Valet Management", icon: Users },
    { id: "activity", label: "Live Activity", icon: Activity },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">
                Vicar Parking Admin
              </h1>
              <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                Admin
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {adminProfile?.fullName || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
