import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 7 days ago
    endDate: new Date().toISOString().split("T")[0], // today
  });
  const [selectedValet, setSelectedValet] = useState("all");
  const [valets, setValets] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    fetchValets();
    generateReport();
  }, []);

  const fetchValets = async () => {
    try {
      const valetsQuery = query(collection(db, "valets"));
      const valetsSnapshot = await getDocs(valetsQuery);
      const valetsData = valetsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setValets(valetsData);
    } catch (error) {
      console.error("Error fetching valets:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(dateRange.startDate);
      const endOfDay = new Date(dateRange.endDate);
      endOfDay.setDate(endOfDay.getDate() + 1); // Include the end date

      let clockInsQuery = query(
        collection(db, "clockIns"),
        where("timestamp", ">=", startOfDay.toISOString()),
        where("timestamp", "<", endOfDay.toISOString()),
        orderBy("timestamp", "asc")
      );

      if (selectedValet !== "all") {
        clockInsQuery = query(
          collection(db, "clockIns"),
          where("valetId", "==", selectedValet),
          where("timestamp", ">=", startOfDay.toISOString()),
          where("timestamp", "<", endOfDay.toISOString()),
          orderBy("timestamp", "asc")
        );
      }

      const clockInsSnapshot = await getDocs(clockInsQuery);
      const clockIns = clockInsSnapshot.docs.map((doc) => doc.data());

      // Process data by valet
      const valetData = processClockInData(clockIns);
      setReportData(valetData);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const processClockInData = (clockIns) => {
    const valetGroups = {};

    clockIns.forEach((record) => {
      if (!valetGroups[record.valetId]) {
        valetGroups[record.valetId] = {
          valetId: record.valetId,
          valetEmail: record.valetEmail,
          sessions: [],
          totalHours: 0,
          totalClockIns: 0,
        };
      }

      const valet = valetGroups[record.valetId];
      if (record.action === "clock_in") {
        valet.totalClockIns++;
        valet.sessions.push({
          clockIn: record.timestamp,
          clockOut: null,
          location: record.location,
        });
      } else if (record.action === "clock_out" && valet.sessions.length > 0) {
        const lastSession = valet.sessions[valet.sessions.length - 1];
        if (!lastSession.clockOut) {
          lastSession.clockOut = record.timestamp;
          const clockInTime = new Date(lastSession.clockIn);
          const clockOutTime = new Date(lastSession.clockOut);
          const sessionHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
          valet.totalHours += sessionHours;
        }
      }
    });

    // Handle ongoing sessions (still clocked in)
    Object.values(valetGroups).forEach((valet) => {
      valet.sessions.forEach((session) => {
        if (!session.clockOut) {
          const now = new Date();
          const clockInTime = new Date(session.clockIn);
          const sessionHours = (now - clockInTime) / (1000 * 60 * 60);
          valet.totalHours += sessionHours;
          session.clockOut = "Still active";
        }
      });
    });

    return Object.values(valetGroups);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvHeaders = [
      "Valet Email",
      "Total Hours",
      "Total Clock-Ins",
      "Sessions",
    ];
    const csvRows = reportData.map((valet) => {
      const sessionsStr = valet.sessions
        .map((session) => {
          const clockIn = new Date(session.clockIn).toLocaleString();
          const clockOut =
            session.clockOut === "Still active"
              ? "Still active"
              : new Date(session.clockOut).toLocaleString();
          return `${clockIn} - ${clockOut}`;
        })
        .join("; ");

      return [
        valet.valetEmail,
        valet.totalHours.toFixed(2),
        valet.totalClockIns,
        `"${sessionsStr}"`,
      ];
    });

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `valet_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported successfully");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (timestamp === "Still active") return timestamp;
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (timestamp) => {
    if (timestamp === "Still active") return timestamp;

    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now - 24 * 60 * 60 * 1000).toDateString() ===
      date.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  const toggleCardExpansion = (valetId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [valetId]: !prev[valetId],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="hidden sm:inline">Reports & Analytics</span>
          <span className="sm:hidden">Reports</span>
        </h2>
        <button
          onClick={exportToCSV}
          disabled={reportData.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="form-label">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="form-input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="form-label">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="form-input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Valet</label>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={selectedValet}
              onChange={(e) => setSelectedValet(e.target.value)}
              className="form-input pl-10 pr-8 appearance-none"
            >
              <option value="all">All Valets</option>
              {valets.map((valet) => (
                <option key={valet.id} value={valet.id}>
                  {valet.fullName || valet.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm">Total Valets</h4>
            <p className="text-2xl font-bold text-blue-600">
              {reportData.length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 text-sm">Total Hours</h4>
            <p className="text-2xl font-bold text-green-600">
              {reportData
                .reduce((sum, valet) => sum + valet.totalHours, 0)
                .toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 text-sm">
              Total Clock-Ins
            </h4>
            <p className="text-2xl font-bold text-purple-600">
              {reportData.reduce((sum, valet) => sum + valet.totalClockIns, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Report Data */}
      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
        </div>
      ) : reportData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No data found for the selected criteria
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {reportData.map((valet, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {valet.valetEmail}
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleCardExpansion(valet.valetId)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedCards[valet.valetId] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Hours</p>
                    <p className="text-sm font-medium text-gray-900">
                      {valet.totalHours.toFixed(1)}h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clock-Ins</p>
                    <p className="text-sm font-medium text-gray-900">
                      {valet.totalClockIns}
                    </p>
                  </div>
                </div>

                {expandedCards[valet.valetId] && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Sessions</p>
                    <div className="space-y-2">
                      {valet.sessions.map((session, sessionIndex) => (
                        <div
                          key={sessionIndex}
                          className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
                        >
                          {formatDateTime(session.clockIn)} -{" "}
                          {formatDateTime(session.clockOut)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock-Ins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((valet, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {valet.valetEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {valet.totalHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {valet.totalClockIns}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {valet.sessions.map((session, sessionIndex) => (
                          <div
                            key={sessionIndex}
                            className="text-xs text-gray-600"
                          >
                            {formatDateTime(session.clockIn)} -{" "}
                            {formatDateTime(session.clockOut)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
