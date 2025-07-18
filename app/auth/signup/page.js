"use client";
import Link from "next/link";
import { Shield, AlertCircle } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Vicar Parking
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Account Registration
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <Shield className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Registration Restricted
            </h3>
            <p className="text-gray-600">
              Valet accounts can only be created by administrators. Please
              contact your supervisor or manager to request access.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-yellow-800">
                  Need Access?
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Contact your administrator to have them create your valet
                  account. Once created, you'll receive login credentials to
                  access the system.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full btn-primary inline-block text-center"
            >
              Back to Login
            </Link>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Administrator?{" "}
                <Link
                  href="/admin/setup"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Set up admin account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
