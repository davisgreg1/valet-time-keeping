import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Activity, TrendingUp } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TodaySummary({ user }) {
  const [summary, setSummary] = useState({
    hoursWorked: 0,
    clockIns: 0,
    currentStatus: "clocked_out",
    isLoading: true,
  });

  useEffect(() => {
    if (user) {
      fetchTodaySummary();
    }
  }, [user]);

  const fetchTodaySummary = async () => {
    try {
      // Get start and end of today
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Query today's clock-ins
      const q = query(
        collection(db, "clockIns"),
        where("valetId", "==", user.uid),
        where("timestamp", ">=", startOfDay.toISOString()),
        where("timestamp", "<", endOfDay.toISOString()),
        orderBy("timestamp", "asc")
      );

      const querySnapshot = await getDocs(q);
      const todaysClockIns = querySnapshot.docs.map((doc) => doc.data());

      // Calculate summary data
      const calculatedSummary = calculateSummary(todaysClockIns);
      setSummary({
        ...calculatedSummary,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching today's summary:", error);
      setSummary((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const calculateSummary = (clockIns) => {
    let hoursWorked = 0;
    let currentStatus = "clocked_out";
    let currentClockIn = null;

    // Sort clock-ins by timestamp
    const sortedClockIns = clockIns.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Calculate hours worked by pairing clock-ins and clock-outs
    for (let i = 0; i < sortedClockIns.length; i++) {
      const clockIn = sortedClockIns[i];

      if (clockIn.action === "clock_in") {
        currentClockIn = new Date(clockIn.timestamp);
        currentStatus = "clocked_in";

        // Look for the next clock-out
        const nextClockOut = sortedClockIns.find(
          (record, index) => index > i && record.action === "clock_out"
        );

        if (nextClockOut) {
          const clockOutTime = new Date(nextClockOut.timestamp);
          const hoursThisSession =
            (clockOutTime - currentClockIn) / (1000 * 60 * 60);
          hoursWorked += hoursThisSession;
          currentStatus = "clocked_out";
        }
      }
    }

    // If currently clocked in, add time from last clock-in to now
    if (currentStatus === "clocked_in" && currentClockIn) {
      const now = new Date();
      const currentSessionHours = (now - currentClockIn) / (1000 * 60 * 60);
      hoursWorked += currentSessionHours;
    }

    return {
      hoursWorked: Math.max(0, hoursWorked),
      clockIns: clockIns.filter((record) => record.action === "clock_in")
        .length,
      currentStatus,
    };
  };

  const formatHours = (hours) => {
    if (hours === 0) return "0.0";
    return hours.toFixed(1);
  };

  const getStatusColor = (status) => {
    return status === "clocked_in" ? "text-green-600" : "text-gray-600";
  };

  const getStatusText = (status) => {
    return status === "clocked_in"
      ? "Currently Clocked In"
      : "Currently Clocked Out";
  };

  if (summary.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Today's Summary
        </h3>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Today's Summary
      </h3>

      <div className="space-y-4">
        {/* Hours Worked */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Hours Worked</div>
              <div className="text-sm text-gray-500">Today's total</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatHours(summary.hoursWorked)}
          </div>
        </div>

        {/* Clock Ins Count */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Clock Ins</div>
              <div className="text-sm text-gray-500">Times clocked in</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {summary.clockIns}
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">Status</div>
            <div
              className={`text-sm font-medium ${getStatusColor(
                summary.currentStatus
              )}`}
            >
              {getStatusText(summary.currentStatus)}
            </div>
          </div>
          {summary.currentStatus === "clocked_in" && (
            <div className="text-xs text-gray-500 mt-1">
              Time is actively being tracked
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
