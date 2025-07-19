import {
  LogOut,
  Shield,
  BarChart3,
  Users,
  Activity,
  FileText,
  Menu,
  X,
  ChevronDown,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

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

  const handleDashboardClick = () => {
    router.push("/dashboard");
    setIsDropdownOpen(false);
  };

  // Get user initials
  const getUserInitials = () => {
    if (adminProfile?.fullName) {
      return adminProfile.fullName
        .split(" ")
        .map((name) => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      shortLabel: "Overview",
    },
    {
      id: "valets",
      label: "Valet Management",
      icon: Users,
      shortLabel: "Valets",
    },
    {
      id: "activity",
      label: "Live Activity",
      icon: Activity,
      shortLabel: "Activity",
    },
    { id: "reports", label: "Reports", icon: FileText, shortLabel: "Reports" },
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-xl sm:text-2xl font-bold text-red-600">
                  <span className="hidden sm:inline cursor-pointer">
                    Vicar Parking Admin
                  </span>
                  <span className="sm:hidden cursor-pointer">Vicar Admin</span>
                </h1>
              </Link>
              <div className="ml-2 sm:ml-4 flex items-center gap-2 px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                Admin
              </div>
            </div>

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
                    {adminProfile?.fullName || user?.email}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Administrator
                  </span>
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
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {/* User Info Section - Mobile Only */}
                  <div className="block sm:hidden px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {getUserInitials()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {adminProfile?.fullName || user?.email}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleDashboardClick}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Home className="w-4 h-4 text-gray-400" />
                      User Dashboard
                    </button>

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
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div className="lg:hidden bg-white border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">Menu</span>
            </button>

            {/* Current tab indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {(() => {
                const currentTab = tabs.find((tab) => tab.id === activeTab);
                const IconComponent = currentTab?.icon;
                return IconComponent ? (
                  <IconComponent className="w-4 h-4" />
                ) : null;
              })()}
              <span>
                {tabs.find((tab) => tab.id === activeTab)?.shortLabel}
              </span>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="grid grid-cols-2 gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 p-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Overlay for mobile menu */}
      {/* {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )} */}
    </div>
  );
}
