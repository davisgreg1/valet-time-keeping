import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, Clock, MapPin, User, RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LiveActivity() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeValets, setActiveValets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    fetchActiveValets();

    // Set up real-time listener if auto-refresh is enabled
    let unsubscribe;
    if (autoRefresh) {
      const q = query(
        collection(db, "clockIns"),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentActivity(activities);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [autoRefresh]);

  const fetchRecentActivity = async () => {
    try {
      const q = query(
        collection(db, "clockIns"),
        orderBy("timestamp", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const fetchActiveValets = async () => {
    try {
      // Get all valets who are currently clocked in
      const valetsQuery = query(collection(db, "valets"));
      const valetsSnapshot = await getDocs(valetsQuery);
      const allValets = valetsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const currentlyActive = [];

      // Check each valet's latest clock action
      for (const valet of allValets) {
        const lastActionQuery = query(
          collection(db, "clockIns"),
          where("valetId", "==", valet.id),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const lastActionSnapshot = await getDocs(lastActionQuery);
        if (!lastActionSnapshot.empty) {
          const lastAction = lastActionSnapshot.docs[0].data();
          if (lastAction.action === "clock_in") {
            currentlyActive.push({
              ...valet,
              lastClockIn: lastAction.timestamp,
              location: lastAction.location,
            });
          }
        }
      }

      setActiveValets(currentlyActive);
    } catch (error) {
      console.error("Error fetching active valets:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return time.toLocaleDateString();
  };

  const getWorkingHours = (clockInTime) => {
    const now = new Date();
    const clockIn = new Date(clockInTime);
    const hours = (now - clockIn) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <LoadingSpinner />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-md ${
                autoRefresh
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600"
              }`}
              title={
                autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"
              }
            >
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activity.action === "clock_in"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {activity.valetEmail?.split("@")[0] || "Unknown Valet"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.action === "clock_in"
                        ? "Clocked in"
                        : "Clocked out"}
                    </div>
                    {activity.location?.shortAddress && (
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activity.location.shortAddress}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatTime(activity.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Currently Active Valets */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Currently Active ({activeValets.length})
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeValets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No valets currently clocked in
            </p>
          ) : (
            activeValets.map((valet) => (
              <div
                key={valet.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {valet.fullName || valet.email?.split("@")[0]}
                    </span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {getWorkingHours(valet.lastClockIn)}h
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  Clocked in: {formatTime(valet.lastClockIn)}
                </div>

                {valet.location?.shortAddress && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {valet.location.shortAddress}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
