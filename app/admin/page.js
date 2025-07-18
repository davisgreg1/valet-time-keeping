'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminStats from '@/components/admin/AdminStats';
import ValetManagement from '@/components/admin/ValetManagement';
import LiveActivity from '@/components/admin/LiveActivity';
import Reports from '@/components/admin/Reports';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminDashboard() {
  const { user, isAdminUser, adminProfile, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdminUser) {
        router.push('/dashboard');
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <AdminStats />
            <LiveActivity />
          </div>
        );
      case 'valets':
        return <ValetManagement adminUser={user} />;
      case 'activity':
        return <LiveActivity />;
      case 'reports':
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
    <AuthGuard user={user} requireActive={false}>
      <AdminLayout
        user={user}
        adminProfile={adminProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </AdminLayout>
    </AuthGuard>
  );
}