'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import Layout from '@/components/Layout';
import ClockInButton from '@/components/ClockInButton';
import ClockInHistory from '@/components/ClockInHistory';
import TodaySummary from '@/components/TodaySummary';
import LocationPermission from '@/components/LocationPermission';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getCurrentLocation } from '@/utils/location';

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      checkLocationPermission();
    }
  }, [user, loading, router]);

  const checkLocationPermission = async () => {
    try {
      await getCurrentLocation();
      setHasLocationPermission(true);
    } catch (error) {
      setHasLocationPermission(false);
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleLocationGranted = () => {
    setHasLocationPermission(true);
  };

  const handleClockAction = () => {
    // Trigger refresh of summary and history
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading || checkingLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthGuard user={user} requireActive={true}>
      <Layout user={user} userProfile={userProfile}>
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.fullName || 'Valet'}!
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Main Content */}
          {!hasLocationPermission ? (
            <div className="flex justify-center">
              <LocationPermission onLocationGranted={handleLocationGranted} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Clock In Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Clock In/Out
                  </h2>
                  <ClockInButton user={user} onClockAction={handleClockAction} />
                  <p className="text-sm text-gray-500 mt-4">
                    Tap the button to clock in or out.<br />
                    Your location will be automatically recorded.
                  </p>
                </div>

                {/* Today's Summary */}
                <TodaySummary user={user} key={refreshTrigger} />
              </div>

              {/* History Section */}
              <div>
                <ClockInHistory user={user} key={refreshTrigger} />
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}