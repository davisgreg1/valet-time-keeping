import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FileText, Download, Calendar, Filter, BarChart3 } from "lucide-react";
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Reports & Analytics
        </h2>
        <button
          onClick={exportToCSV}
          disabled={reportData.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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

        <div className="md:col-span-3">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900">Total Valets</h4>
            <p className="text-2xl font-bold text-blue-600">
              {reportData.length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900">Total Hours</h4>
            <p className="text-2xl font-bold text-green-600">
              {reportData
                .reduce((sum, valet) => sum + valet.totalHours, 0)
                .toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900">Total Clock-Ins</h4>
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
        <div className="overflow-x-auto">
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
                          {formatTime(session.clockIn)} -{" "}
                          {formatTime(session.clockOut)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
