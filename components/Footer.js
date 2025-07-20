import { Heart, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Main Signature */}
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <span className="text-sm">Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
            <span className="text-sm">in</span>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Memphis</span>
            </div>
          </div>

          {/* Company Credit */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              by{" "}
              <span className="font-semibold text-gray-700 hover:text-red-600 transition-colors">
                GregDavisTech, LLC
              </span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 w-full text-center">
            © {currentYear} Vicar Parking. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
