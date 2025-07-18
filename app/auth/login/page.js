"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, resetPassword } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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

    const result = await signIn(formData.email, formData.password);

    if (result.success) {
      toast.success("Login successful!");
      router.push("/dashboard");
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    const result = await resetPassword(resetEmail);
    if (result.success) {
      toast.success("Password reset email sent!");
      setShowResetForm(false);
      setResetEmail("");
    } else {
      toast.error(result.error);
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
                  Sign up
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
