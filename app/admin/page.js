"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import AuthGuard from "@/components/AuthGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStats from "@/components/admin/AdminStats";
import ValetManagement from "@/components/admin/ValetManagement";
import LiveActivity from "@/components/admin/LiveActivity";
import Reports from "@/components/admin/Reports";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminDashboard() {
  const { user, isAdminUser, adminProfile, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (!isAdminUser) {
        // User is not an admin, redirect to valet dashboard
        router.push("/dashboard");
      }
    }
  }, [user, isAdminUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return null; // Will redirect based on useEffect above
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <AdminStats />
            <LiveActivity />
          </div>
        );
      case "valets":
        return <ValetManagement adminUser={user} />;
      case "activity":
        return <LiveActivity />;
      case "reports":
        return <Reports />;
      default:
        return (
          <div className="space-y-8">
            <AdminStats />
            <LiveActivity />
          </div>
        );
    }
  };

  // Show notification if this is a promoted valet admin
  const isPromotedValet =
    adminProfile && adminProfile.email && !adminProfile.role;

  return (
    <AuthGuard user={user} requireActive={false}>
      <AdminLayout
        user={user}
        adminProfile={adminProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* Show notification for promoted valet admins */}
        {isPromotedValet && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h3 className="text-sm font-medium text-purple-900">
                  Admin Access Granted
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  You have been promoted to administrator. You now have access
                  to all admin features including valet management, reports, and
                  system analytics. You can still use your regular valet
                  clock-in functions as well.
                </p>
              </div>
            </div>
          </div>
        )}

        {renderTabContent()}
      </AdminLayout>
    </AuthGuard>
  );
}
