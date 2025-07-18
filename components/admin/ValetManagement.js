import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
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
    let filtered = [...valets]; // Create a new array to avoid mutation

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

  const toggleValetStatus = async (valetId, currentStatus, valetName) => {
    const action = currentStatus ? "deactivate" : "activate";
    const actionPast = currentStatus ? "deactivated" : "activated";

    // Show confirmation for deactivation
    if (currentStatus) {
      const confirmed = confirm(
        `Are you sure you want to deactivate ${valetName}?\n\n` +
          `This will:\n` +
          `• Prevent them from logging in\n` +
          `• Block future clock-ins\n` +
          `• Keep all their historical data\n\n` +
          `You can reactivate them later if needed.`
      );

      if (!confirmed) return;
    }

    try {
      const valetRef = doc(db, "valets", valetId);
      await updateDoc(valetRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
        [`${action}dBy`]: adminUser?.uid || "unknown",
        [`${action}dAt`]: new Date().toISOString(),
      });

      // Update local state
      setValets((prev) =>
        prev.map((valet) =>
          valet.id === valetId ? { ...valet, isActive: !currentStatus } : valet
        )
      );

      if (currentStatus) {
        toast.success(
          `${valetName} has been deactivated. They can no longer access the system.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `${valetName} has been reactivated and can now access the system.`
        );
      }
    } catch (error) {
      console.error("Error updating valet status:", error);
      toast.error(`Failed to ${action} valet`);
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

    // Additional confirmation
    const confirmText = prompt(
      `To permanently delete ${valetName}, type "DELETE" (all caps):`
    );

    if (confirmText !== "DELETE") {
      toast.error("Deletion cancelled - text did not match");
      return;
    }

    try {
      await deleteDoc(doc(db, "valets", valetId));

      // Update local state
      setValets((prev) => prev.filter((valet) => valet.id !== valetId));

      toast.success(`${valetName} has been permanently deleted`);
    } catch (error) {
      console.error("Error deleting valet:", error);
      toast.error("Failed to delete valet");
    }
  };

  const handleValetAdded = useCallback(() => {
    // Refresh the valets list
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
                Valet Status Controls
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Deactivate:</strong> Blocks login and clock-ins while
                preserving data. Use for temporary suspension.
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

        {/* Valets Table */}
        <div className="overflow-x-auto">
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
                    colSpan="6"
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
                              valet.fullName
                            )
                          }
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            valet.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          title={
                            valet.isActive
                              ? "Deactivate valet (blocks login)"
                              : "Reactivate valet"
                          }
                        >
                          {valet.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setEditingValet(valet)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit valet"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteValet(valet.id, valet.fullName)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Permanently delete valet"
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

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredValets.length} of {valets.length} valets
        </div>
      </div>

      {/* Add Valet Modal */}
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
