import { reverseGeocode } from "./geocoding";

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        let errorMessage = "Unknown error occurred";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

export const getCurrentLocationWithAddress = async () => {
  try {
    const location = await getCurrentLocation();
    const geocodeResult = await reverseGeocode(
      location.latitude,
      location.longitude
    );

    return {
      ...location,
      address: geocodeResult.address,
      shortAddress: geocodeResult.shortAddress,
      geocoded: geocodeResult.success,
      fallback: geocodeResult.fallback || false,
    };
  } catch (error) {
    throw error;
  }
};

export const formatLocation = (latitude, longitude) => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};
