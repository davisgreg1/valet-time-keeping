import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Shield,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddValetModal from "./AddValetModal";
import toast from "react-hot-toast";

export default function ValetManagement({ adminUser }) {
  const [valets, setValets] = useState([]);
  const [filteredValets, setFilteredValets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingValet, setEditingValet] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchValets = useCallback(async () => {
    try {
      setLoading(true);
      const valetsQuery = query(collection(db, "valets"));
      const valetsSnapshot = await getDocs(valetsQuery);

      const valetsData = valetsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setValets(valetsData);
    } catch (error) {
      console.error("Error fetching valets:", error);
      toast.error("Failed to fetch valets");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterValets = useCallback(() => {
    let filtered = [...valets];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (valet) =>
          valet.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          valet.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          valet.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((valet) =>
        filterStatus === "active" ? valet.isActive : !valet.isActive
      );
    }

    setFilteredValets(filtered);
  }, [valets, searchTerm, filterStatus]);

  // Initial fetch
  useEffect(() => {
    fetchValets();
  }, [fetchValets]);

  // Filter when dependencies change
  useEffect(() => {
    filterValets();
  }, [filterValets]);

  // Function to check if valet is currently clocked in
  const isValetClockedIn = async (valetId) => {
    try {
      const lastActionQuery = query(
        collection(db, "clockIns"),
        where("valetId", "==", valetId),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const lastActionSnapshot = await getDocs(lastActionQuery);
      if (!lastActionSnapshot.empty) {
        const lastAction = lastActionSnapshot.docs[0].data();
        return lastAction.action === "clock_in";
      }
      return false;
    } catch (error) {
      console.error("Error checking valet clock status:", error);
      return false;
    }
  };

  // Function to automatically clock out a valet
  const autoClockOutValet = async (valetId, valetEmail) => {
    try {
      const clockOutData = {
        valetId: valetId,
        valetEmail: valetEmail,
        action: "clock_out",
        timestamp: new Date().toISOString(),
        location: {
          latitude: null,
          longitude: null,
          accuracy: null,
          formatted: "System Auto Clock-Out",
          address: "Automatically clocked out due to account deactivation",
          shortAddress: "Auto Clock-Out",
          geocoded: false,
        },
        deviceInfo: {
          userAgent: "System Admin",
          platform: "Admin Dashboard",
        },
        autoClockOut: true,
        reason: "Account deactivated by administrator",
        adminId: adminUser?.uid || "unknown",
      };

      await addDoc(collection(db, "clockIns"), clockOutData);
      return true;
    } catch (error) {
      console.error("Error auto-clocking out valet:", error);
      return false;
    }
  };

  const toggleValetStatus = async (
    valetId,
    currentStatus,
    valetName,
    valetEmail
  ) => {
    const action = currentStatus ? "deactivate" : "activate";

    if (currentStatus) {
      const confirmed = confirm(
        `Are you sure you want to deactivate ${valetName}?\n\n` +
          `This will:\n` +
          `• Prevent them from logging in\n` +
          `• Block future clock-ins\n` +
          `• Automatically clock them out if currently clocked in\n` +
          `• Keep all their historical data\n\n` +
          `You can reactivate them later if needed.`
      );

      if (!confirmed) return;
    }

    try {
      // If deactivating, check if valet is currently clocked in
      let wasAutoClockOut = false;
      if (currentStatus) {
        const isClockedIn = await isValetClockedIn(valetId);
        if (isClockedIn) {
          const clockOutSuccess = await autoClockOutValet(valetId, valetEmail);
          if (clockOutSuccess) {
            wasAutoClockOut = true;
          } else {
            toast.error("Failed to auto clock-out valet. Please try again.");
            return;
          }
        }
      }

      const valetRef = doc(db, "valets", valetId);
      await updateDoc(valetRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
        [`${action}dBy`]: adminUser?.uid || "unknown",
        [`${action}dAt`]: new Date().toISOString(),
      });

      setValets((prev) =>
        prev.map((valet) =>
          valet.id === valetId ? { ...valet, isActive: !currentStatus } : valet
        )
      );

      if (currentStatus) {
        const clockOutMessage = wasAutoClockOut
          ? " They have been automatically clocked out."
          : "";
        toast.success(`${valetName} has been deactivated.${clockOutMessage}`, {
          duration: 6000,
        });
      } else {
        toast.success(`${valetName} has been reactivated.`);
      }
    } catch (error) {
      console.error("Error updating valet status:", error);
      toast.error(`Failed to ${action} valet`);
    }
  };

  const toggleAdminRole = async (valetId, currentAdminStatus, valetName) => {
    const action = currentAdminStatus
      ? "remove admin access from"
      : "promote to admin";

    const confirmed = confirm(
      `Are you sure you want to ${action} ${valetName}?\n\n` +
        (currentAdminStatus
          ? `This will:\n• Remove their admin dashboard access\n• They'll return to regular valet functions\n• Keep all their valet data intact`
          : `This will:\n• Grant them admin dashboard access\n• Allow them to manage other valets\n• Give them access to reports and analytics\n• They'll retain valet clock-in abilities`) +
        `\n\nThis action can be reversed later.`
    );

    if (!confirmed) return;

    try {
      const valetRef = doc(db, "valets", valetId);
      await updateDoc(valetRef, {
        isAdmin: !currentAdminStatus,
        updatedAt: new Date().toISOString(),
        [`${currentAdminStatus ? "adminRemovedBy" : "adminPromotedBy"}`]:
          adminUser?.uid || "unknown",
        [`${currentAdminStatus ? "adminRemovedAt" : "adminPromotedAt"}`]:
          new Date().toISOString(),
      });

      setValets((prev) =>
        prev.map((valet) =>
          valet.id === valetId
            ? { ...valet, isAdmin: !currentAdminStatus }
            : valet
        )
      );

      const actionPast = currentAdminStatus
        ? "removed admin access from"
        : "promoted to admin";
      toast.success(
        `${valetName} has been ${actionPast}. Changes will take effect on their next login.`,
        { duration: 6000 }
      );
    } catch (error) {
      console.error("Error updating admin role:", error);
      toast.error(`Failed to update admin role for ${valetName}`);
    }
  };

  const deleteValet = async (valetId, valetName) => {
    const confirmed = confirm(
      `⚠️ WARNING: Delete ${valetName}?\n\n` +
        `This will PERMANENTLY:\n` +
        `• Delete their account\n` +
        `• Remove all their clock-in history\n` +
        `• Cannot be undone\n\n` +
        `Consider deactivating instead of deleting.\n\n` +
        `Type "DELETE" to confirm:`
    );

    if (!confirmed) return;

    const confirmText = prompt(
      `To permanently delete ${valetName}, type "DELETE" (all caps):`
    );

    if (confirmText !== "DELETE") {
      toast.error("Deletion cancelled - text did not match");
      return;
    }

    try {
      await deleteDoc(doc(db, "valets", valetId));
      setValets((prev) => prev.filter((valet) => valet.id !== valetId));
      toast.success(`${valetName} has been permanently deleted`);
    } catch (error) {
      console.error("Error deleting valet:", error);
      toast.error("Failed to delete valet");
    }
  };

  const handleValetAdded = useCallback(() => {
    fetchValets();
  }, [fetchValets]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Valet Management
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Valet
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Valet Management Controls
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Deactivate:</strong> Blocks login and clock-ins while
                preserving data. Auto-clocks out if currently active.
                <br />
                <strong>Admin Role:</strong> Grants full admin dashboard access,
                valet management, and reporting capabilities.
                <br />
                <strong>Delete:</strong> Permanently removes valet and all their
                data. Cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search valets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input pl-10 pr-8 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {filteredValets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {valets.length === 0
                ? "No valets found"
                : "No valets match your filters"}
            </div>
          ) : (
            filteredValets.map((valet) => (
              <div
                key={valet.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {valet.fullName || "N/A"}
                      </h3>
                      {valet.isAdmin && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex-shrink-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {valet.email}
                    </p>
                    {valet.phoneNumber && (
                      <p className="text-sm text-gray-500 mt-1">
                        {valet.phoneNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ml-3 flex-shrink-0 ${
                      valet.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {valet.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Employee ID:</span>
                    <div className="text-gray-900">
                      {valet.employeeId || "Not set"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span>
                    <div className="text-gray-900">
                      {formatDate(valet.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleValetStatus(
                          valet.id,
                          valet.isActive,
                          valet.fullName,
                          valet.email
                        )
                      }
                      className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        valet.isActive
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300"
                          : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
                      }`}
                    >
                      {valet.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() =>
                        toggleAdminRole(valet.id, valet.isAdmin, valet.fullName)
                      }
                      className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        valet.isAdmin
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
                      }`}
                    >
                      {valet.isAdmin ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingValet(valet)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      title="Edit valet"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteValet(valet.id, valet.fullName)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      title="Delete valet"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValets.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {valets.length === 0
                      ? "No valets found"
                      : "No valets match your filters"}
                  </td>
                </tr>
              ) : (
                filteredValets.map((valet) => (
                  <tr key={valet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {valet.fullName || "N/A"}
                        </div>
                        {valet.phoneNumber && (
                          <div className="text-xs text-gray-500">
                            {valet.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{valet.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {valet.employeeId || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          valet.isAdmin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {valet.isAdmin && <Shield className="w-3 h-3 mr-1" />}
                        {valet.isAdmin ? "Admin" : "Valet"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          valet.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {valet.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(valet.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleValetStatus(
                              valet.id,
                              valet.isActive,
                              valet.fullName,
                              valet.email
                            )
                          }
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            valet.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {valet.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() =>
                            toggleAdminRole(
                              valet.id,
                              valet.isAdmin,
                              valet.fullName
                            )
                          }
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            valet.isAdmin
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {valet.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => setEditingValet(valet)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteValet(valet.id, valet.fullName)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredValets.length} of {valets.length} valets
        </div>
      </div>

      {showAddModal && (
        <AddValetModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onValetAdded={handleValetAdded}
          adminUser={adminUser}
        />
      )}
    </>
  );
}
