import { useState } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import { getCurrentLocation } from "@/utils/location";

export default function LocationPermission({ onLocationGranted }) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState("");

  const requestLocationPermission = async () => {
    setIsRequesting(true);
    setError("");

    try {
      const location = await getCurrentLocation();
      onLocationGranted(location);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Location Permission Required
        </h3>
        <p className="text-gray-600 mb-4">
          To clock in, we need access to your location to verify your work site.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={requestLocationPermission}
          disabled={isRequesting}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isRequesting ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Allow Location Access
            </>
          )}
        </button>
      </div>
    </div>
  );
}
