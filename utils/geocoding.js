// Mapbox Geocoding Service
export const reverseGeocodeMapbox = async (latitude, longitude) => {
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token not configured");
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        success: true,
        address: feature.place_name,
        shortAddress: feature.text || feature.place_name,
        coordinates: feature.center,
        context: feature.context || [],
      };
    } else {
      return {
        success: false,
        error: "No address found for this location",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Google Maps Geocoding Service (Alternative)
export const reverseGeocodeGoogle = async (latitude, longitude) => {
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        address: result.formatted_address,
        shortAddress:
          result.address_components[0]?.long_name || result.formatted_address,
        coordinates: [
          result.geometry.location.lng,
          result.geometry.location.lat,
        ],
        placeId: result.place_id,
      };
    } else {
      return {
        success: false,
        error: data.status || "No address found for this location",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// OpenCage Geocoding Service (Free Option)
export const reverseGeocodeOpenCage = async (latitude, longitude) => {
  const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

  if (!OPENCAGE_API_KEY) {
    throw new Error("OpenCage API key not configured");
  }

  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&limit=1`
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        address: result.formatted,
        shortAddress:
          result.components.building ||
          result.components.house_number + " " + result.components.road ||
          result.formatted,
        coordinates: [result.geometry.lng, result.geometry.lat],
        components: result.components,
      };
    } else {
      return {
        success: false,
        error: "No address found for this location",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Main geocoding function with fallback
export const reverseGeocode = async (latitude, longitude) => {
  // Try Mapbox first (recommended)
  if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    const mapboxResult = await reverseGeocodeMapbox(latitude, longitude);
    if (mapboxResult.success) {
      return mapboxResult;
    }
  }

  // Fallback to Google Maps
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    const googleResult = await reverseGeocodeGoogle(latitude, longitude);
    if (googleResult.success) {
      return googleResult;
    }
  }

  // Fallback to OpenCage
  if (process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
    const opencageResult = await reverseGeocodeOpenCage(latitude, longitude);
    if (opencageResult.success) {
      return opencageResult;
    }
  }

  // If all fail, return coordinates as fallback
  return {
    success: true,
    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    shortAddress: "Location captured",
    coordinates: [longitude, latitude],
    fallback: true,
  };
};
