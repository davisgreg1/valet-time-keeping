"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStats from "@/components/admin/AdminStats";
import ValetManagement from "@/components/admin/ValetManagement";
import LiveActivity from "@/components/admin/LiveActivity";
import Reports from "@/components/admin/Reports";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Shield, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdminUser, adminProfile, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (!isAdminUser) {
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

  if (!user) {
    return null;
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have administrator privileges to access this page.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            Go to Valet Dashboard
          </button>
        </div>
      </div>
    );
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
        return <ValetManagement />;
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

  return (
    <AdminLayout
      user={user}
      adminProfile={adminProfile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </AdminLayout>
  );
}
