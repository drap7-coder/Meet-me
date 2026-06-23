import {
  autocompleteLocations,
  geocodeAddress,
  reverseGeocodeLocation,
  searchHalfway
} from "@/lib/google";
import type { GooglePlacesProvider } from "@/lib/providers/types";

export const googlePlacesProvider: GooglePlacesProvider = {
  geocodeAddress,
  reverseGeocodeLocation,
  autocompleteLocations,
  searchHalfway
};
