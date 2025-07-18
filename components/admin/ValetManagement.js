import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Edit, Trash2, Plus, Search, Filter } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function ValetManagement() {
  const [valets, setValets] = useState([]);
  const [filteredValets, setFilteredValets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingValet, setEditingValet] = useState(null);

  useEffect(() => {
    fetchValets();
  }, []);

  useEffect(() => {
    filterValets();
  }, [valets, searchTerm, filterStatus]);

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
      toast.error("Failed to fetch valets");
    } finally {
      setLoading(false);
    }
  };

  const filterValets = () => {
    let filtered = valets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (valet) =>
          valet.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          valet.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((valet) =>
        filterStatus === "active" ? valet.isActive : !valet.isActive
      );
    }

    setFilteredValets(filtered);
  };

  const toggleValetStatus = async (valetId, currentStatus) => {
    try {
      const valetRef = doc(db, "valets", valetId);
      await updateDoc(valetRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
      });

      setValets((prev) =>
        prev.map((valet) =>
          valet.id === valetId ? { ...valet, isActive: !currentStatus } : valet
        )
      );

      toast.success(`Valet ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating valet status:", error);
      toast.error("Failed to update valet status");
    }
  };

  const deleteValet = async (valetId) => {
    if (
      !confirm(
        "Are you sure you want to delete this valet? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "valets", valetId));
      setValets((prev) => prev.filter((valet) => valet.id !== valetId));
      toast.success("Valet deleted successfully");
    } catch (error) {
      console.error("Error deleting valet:", error);
      toast.error("Failed to delete valet");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Valet Management
        </h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Valet
        </button>
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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No valets found
                </td>
              </tr>
            ) : (
              filteredValets.map((valet) => (
                <tr key={valet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {valet.fullName || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{valet.email}</div>
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
                          toggleValetStatus(valet.id, valet.isActive)
                        }
                        className={`px-3 py-1 text-xs rounded ${
                          valet.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {valet.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setEditingValet(valet)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteValet(valet.id)}
                        className="text-red-600 hover:text-red-900"
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
  );
}
