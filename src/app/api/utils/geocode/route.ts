import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';

// POST /api/utils/geocode - Geocode coordinates or address using Google Maps API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, address } = body;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return errorResponse('Configuration error', 'Google Maps API key is not configured', 500);
    }

    let url = '';
    if (lat && lng) {
      // Reverse geocoding: coordinates to address
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=tr&key=${apiKey}`;
    } else if (address) {
      // Forward geocoding: address to coordinates
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=tr&key=${apiKey}`;
    } else {
      return errorResponse('Validation error', 'Either lat/lng or address is required', 400);
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      const addressComponents = result.address_components || [];
      
      const formattedAddress = result.formatted_address || '';
      let city = '';
      let country = '';
      let postalCode = '';

      addressComponents.forEach((component: any) => {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      return successResponse({
        lat: location.lat,
        lng: location.lng,
        address: formattedAddress,
        city,
        country,
        postalCode,
      });
    }

    return errorResponse('Geocoding error', data.error_message || 'Failed to geocode', 400);
  } catch (error: any) {
    console.error('Error geocoding:', error);
    return errorResponse('Internal server error', error.message || 'Failed to geocode', 500);
  }
}















