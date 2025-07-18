import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, MapPin, Calendar } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export default function ClockInHistory({ user }) {
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClockIns();
  }, [user]);

  const fetchClockIns = async () => {
    try {
      const q = query(
        collection(db, "clockIns"),
        where("valetId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const clockInData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClockIns(clockInData);
    } catch (error) {
      console.error("Error fetching clock-ins:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Recent Activity
      </h2>

      {clockIns.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No clock-ins yet</p>
      ) : (
        <div className="space-y-4">
          {clockIns.map((clockIn) => (
            <div
              key={clockIn.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    clockIn.action === "clock_in"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <div className="font-medium text-gray-900">
                    {clockIn.action === "clock_in"
                      ? "Clocked In"
                      : "Clocked Out"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {clockIn.location?.address ||
                      clockIn.location?.shortAddress ||
                      clockIn.location?.formatted ||
                      "Location unavailable"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(clockIn.timestamp)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(clockIn.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
