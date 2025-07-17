import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getCountryFromCoordinates(lat: number, lng: number): Promise<string | null> {
  const geocoder = new google.maps.Geocoder();
  const latlng = { lat, lng };
  try {
    const { results } = await geocoder.geocode({ location: latlng });
    if (results[0]) {
      for (const component of results[0].address_components) {
        if (component.types.includes("country")) {
          return component.short_name;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}
