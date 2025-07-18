"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { resetPassword } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [authError, setAuthError] = useState(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      // First, sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Force token refresh to get latest claims
      await user.getIdToken(true);

      // Check if user is an admin first (dedicated admin account)
      const adminRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminRef);

      if (adminDoc.exists()) {
        // User is a dedicated admin
        toast.success("Admin login successful!");
        router.push("/admin");
        setIsLoading(false);
        return;
      }

      // Check if user is a valet
      const valetRef = doc(db, "valets", user.uid);
      const valetDoc = await getDoc(valetRef);

      if (valetDoc.exists()) {
        const valetData = valetDoc.data();

        // Check if valet account is active
        if (valetData.isActive === false) {
          // Sign out the user immediately
          await auth.signOut();
          setAuthError({
            type: "deactivated",
            email: formData.email,
          });
          setIsLoading(false);
          return;
        }

        // Check if valet has admin privileges
        if (valetData.isAdmin === true) {
          // Valet has been promoted to admin
          toast.success(
            "Admin access granted! Welcome to the admin dashboard."
          );
          router.push("/admin");
          setIsLoading(false);
          return;
        }

        // Valet is active - update last login and proceed to valet dashboard
        try {
          await updateDoc(valetRef, {
            lastLogin: new Date().toISOString(),
          });
        } catch (updateError) {
          console.warn("Could not update last login:", updateError);
          // Don't block login for this non-critical update
        }

        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        // User exists in Firebase Auth but not in valets or admins collection
        await auth.signOut();
        setAuthError({
          type: "not_found",
          email: formData.email,
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email address.");
      } else if (error.code === "auth/wrong-password") {
        setAuthError({
          type: "wrong_password",
          email: formData.email,
        });
      } else if (error.code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many login attempts. Please try again later.");
      } else if (error.code === "auth/user-disabled") {
        setAuthError({
          type: "disabled",
          email: formData.email,
        });
      } else {
        toast.error(
          "Login failed. Please check your credentials and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    const result = await resetPassword(resetEmail);
    if (result.success) {
      toast.success(
        "Password reset email sent! Check your inbox and follow the instructions."
      );
      setShowResetForm(false);
      setResetEmail("");
      setAuthError(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleQuickReset = async (email) => {
    const result = await resetPassword(email);
    if (result.success) {
      toast.success(
        "Password reset email sent! Check your inbox and follow the instructions."
      );
      setAuthError(null);
    } else {
      toast.error(result.error);
    }
  };

  // Render auth error messages
  const renderAuthError = () => {
    if (!authError) return null;

    switch (authError.type) {
      case "deactivated":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Account Deactivated
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Your account has been deactivated. Please contact your
                  administrator for assistance.
                </p>
              </div>
            </div>
          </div>
        );

      case "wrong_password":
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Incorrect Password
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The password you entered is incorrect. If your account was
                  recently reactivated, you may need to reset your password.
                </p>
                <button
                  onClick={() => handleQuickReset(authError.email)}
                  className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  Reset password for {authError.email}
                </button>
              </div>
            </div>
          </div>
        );

      case "disabled":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Account Disabled
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This account has been disabled in Firebase. Please contact
                  your administrator.
                </p>
                <button
                  onClick={() => handleQuickReset(authError.email)}
                  className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                >
                  Try password reset
                </button>
              </div>
            </div>
          </div>
        );

      case "not_found":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Account Not Found
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Your account was not found in the system. Please contact your
                  administrator.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Vicar Parking
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">Clock in and manage your shifts</p>
        </div>

        {!showResetForm ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-8 space-y-6"
          >
            {renderAuthError()}

            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Contact your administrator
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handlePasswordReset}
            className="bg-white rounded-lg shadow-md p-8 space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reset Password
              </h3>
              <p className="text-gray-600 mb-4">
                Enter your email to receive a password reset link
              </p>

              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="flex-1 btn-primary">
                Send Reset Email
              </button>
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
