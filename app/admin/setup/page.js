"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createAdmin } from "@/lib/adminAuth";
import { Shield, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSetup() {
  const { user, userProfile, loading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [adminData, setAdminData] = useState({
    fullName: "",
    department: "Administration",
    phoneNumber: "",
  });
  const router = useRouter();

  const handleInputChange = (e) => {
    setAdminData({
      ...adminData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create an admin account");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createAdmin(user.uid, {
        email: user.email,
        fullName: adminData.fullName || userProfile?.fullName || user.email,
        department: adminData.department,
        phoneNumber: adminData.phoneNumber,
      });

      if (result.success) {
        toast.success("Admin account created successfully!");
        router.push("/admin");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin account");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Setup</h1>
          <p className="text-gray-600">
            Create your administrator account for Vicar Parking
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Important</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This page is for setting up the first admin account. Once
                created, you'll have access to the full admin dashboard to
                manage valets and view reports.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCreateAdmin}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={adminData.fullName}
              onChange={handleInputChange}
              placeholder={userProfile?.fullName || "Enter your full name"}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Email (Current Account)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="form-input bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your current logged-in email will be used for the admin account
            </p>
          </div>

          <div>
            <label className="form-label">Department</label>
            <select
              name="department"
              value={adminData.department}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="Administration">Administration</option>
              <option value="Operations">Operations</option>
              <option value="Management">Management</option>
              <option value="HR">Human Resources</option>
            </select>
          </div>

          <div>
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phoneNumber"
              value={adminData.phoneNumber}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating Admin Account...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Create Admin Account
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have access?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Go to Admin Dashboard
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
