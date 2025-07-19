import { useState, useCallback } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createValetAccount,
  generateTemporaryPassword,
} from "@/lib/adminServices";
import toast from "react-hot-toast";

const initialFormData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  employeeId: "",
  department: "Valet Services",
  temporaryPassword: "",
};

export default function AddValetModal({
  isOpen,
  onClose,
  onValetAdded,
  adminUser,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdValet, setCreatedValet] = useState(null);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const password = generateTemporaryPassword();
    setFormData((prev) => ({ ...prev, temporaryPassword: password }));
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!adminUser) {
        toast.error("Admin user not found");
        return;
      }

      setIsCreating(true);

      try {
        // Generate password if not provided
        const password =
          formData.temporaryPassword || generateTemporaryPassword();
        const valetData = { ...formData, temporaryPassword: password };

        const result = await createValetAccount(valetData, adminUser);

        if (result.success) {
          setCreatedValet({
            ...valetData,
            userId: result.userId,
            temporaryPassword: result.temporaryPassword,
          });

          // Notify parent component
          if (onValetAdded) {
            onValetAdded();
          }
        } else {
          toast.error(result.error || "Failed to create valet account");
        }
      } catch (error) {
        console.error("Error creating valet:", error);
        toast.error("Failed to create valet account");
      } finally {
        setIsCreating(false);
      }
    },
    [formData, adminUser, onValetAdded]
  );

  const handleClose = useCallback(() => {
    // Reset all state
    setFormData(initialFormData);
    setCreatedValet(null);
    setIsCreating(false);
    setShowPassword(false);
    onClose();
  }, [onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Show success screen after valet is created
  if (createdValet) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-green-600">
              Valet Created Successfully!
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">
                Account Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {createdValet.fullName}
                </div>
                <div>
                  <strong>Email:</strong> {createdValet.email}
                </div>
                {createdValet.employeeId && (
                  <div>
                    <strong>Employee ID:</strong> {createdValet.employeeId}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">
                Temporary Password
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={createdValet.temporaryPassword}
                  readOnly
                  className="flex-1 p-2 border border-yellow-300 rounded text-sm font-mono bg-white"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-yellow-600 hover:text-yellow-800"
                  title={showPassword ? "Hide password" : "Show password"}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(createdValet.temporaryPassword)
                  }
                  className="p-2 text-yellow-600 hover:text-yellow-800"
                  title="Copy password"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                Please share this password securely with the valet. They should
                change it on first login.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-1">Next Steps</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Share the login credentials with the valet</li>
                <li>• Instruct them to visit the login page</li>
                <li>• They should change their password on first login</li>
              </ul>
            </div>

            <button
              onClick={handleClose}
              className="w-full btn-primary"
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show creation form
  return (
    <div className="fixed inset-0 bg-black  flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Valet</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-input pl-10"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input pl-10"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="form-input pl-10"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Employee ID</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="form-input pl-10"
                placeholder="VP001"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="Valet Services">Valet Services</option>
              <option value="Parking Operations">Parking Operations</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label className="form-label">Temporary Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="temporaryPassword"
                value={formData.temporaryPassword}
                onChange={handleInputChange}
                className="form-input flex-1"
                placeholder="Auto-generated if empty"
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="btn-secondary px-3"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If empty, a secure password will be generated automatically.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> The valet will receive temporary login
              credentials. Ensure they change their password on first login.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 btn-primary"
            >
              {isCreating ? "Creating..." : "Create Valet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
