import { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Clock, Activity, TrendingUp } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalValets: 0,
    activeValets: 0,
    todayClockIns: 0,
    totalHoursToday: 0,
    isLoading: true,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total valets
      const valetsQuery = query(collection(db, "valets"));
      const valetsSnapshot = await getDocs(valetsQuery);
      const totalValets = valetsSnapshot.size;

      // Get active valets (those who have clocked in at least once)
      const activeValetsQuery = query(
        collection(db, "valets"),
        where("isActive", "==", true)
      );
      const activeValetsSnapshot = await getDocs(activeValetsQuery);
      const activeValets = activeValetsSnapshot.size;

      // Get today's data
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

      const todayQuery = query(
        collection(db, "clockIns"),
        where("timestamp", ">=", startOfDay.toISOString()),
        where("timestamp", "<", endOfDay.toISOString()),
        orderBy("timestamp", "asc")
      );

      const todaySnapshot = await getDocs(todayQuery);
      const todayClockIns = todaySnapshot.docs.map((doc) => doc.data());

      // Calculate today's stats
      const clockInCount = todayClockIns.filter(
        (record) => record.action === "clock_in"
      ).length;
      const totalHours = calculateTotalHours(todayClockIns);

      setStats({
        totalValets,
        activeValets,
        todayClockIns: clockInCount,
        totalHoursToday: totalHours,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const calculateTotalHours = (clockIns) => {
    // Group by valet
    const valetGroups = {};
    clockIns.forEach((record) => {
      if (!valetGroups[record.valetId]) {
        valetGroups[record.valetId] = [];
      }
      valetGroups[record.valetId].push(record);
    });

    let totalHours = 0;

    // Calculate hours for each valet
    Object.values(valetGroups).forEach((valetRecords) => {
      const sortedRecords = valetRecords.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      let currentClockIn = null;
      sortedRecords.forEach((record) => {
        if (record.action === "clock_in") {
          currentClockIn = new Date(record.timestamp);
        } else if (record.action === "clock_out" && currentClockIn) {
          const clockOut = new Date(record.timestamp);
          const hours = (clockOut - currentClockIn) / (1000 * 60 * 60);
          totalHours += hours;
          currentClockIn = null;
        }
      });

      // If still clocked in, add current session
      if (currentClockIn) {
        const now = new Date();
        const hours = (now - currentClockIn) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    return totalHours;
  };

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <LoadingSpinner />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Valets",
      value: stats.totalValets,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Valets",
      value: stats.activeValets,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Today's Clock-Ins",
      value: stats.todayClockIns,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Hours Today",
      value: stats.totalHoursToday.toFixed(1),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
