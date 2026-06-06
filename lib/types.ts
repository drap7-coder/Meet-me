export type LatLng = {
  lat: number;
  lng: number;
};

export type VenueCategory =
  | "restaurant"
  | "bar"
  | "coffee"
  | "bookstore"
  | "driving_range"
  | "park"
  | "dessert"
  | "custom";

export type Preference =
  | "downtown"
  | "walkable"
  | "easy_parking"
  | "waterfront"
  | "outdoor_seating"
  | "upscale"
  | "family_friendly";

export type GeocodedLocation = {
  input: string;
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
};

export type PlaceSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};

export type VenueCandidate = {
  id: string;
  name: string;
  category: string;
  address: string;
  location: LatLng;
  rating: number | null;
  reviewCount: number;
  openNow: boolean | null;
  googleMapsUri: string;
  websiteUri?: string;
  types?: string[];
};

export type RouteLeg = {
  distanceMeters: number | null;
  durationMinutes: number | null;
  status: string;
};

export type ScoredVenue = VenueCandidate & {
  travelFromA: RouteLeg;
  travelFromB: RouteLeg;
  timeDifferenceMinutes: number | null;
  totalTravelMinutes: number | null;
  fairnessScore: number;
  preferenceScore: number;
  preferenceMatches: Preference[];
};

export type SearchHalfwayRequest = {
  locationA: string;
  locationAPlaceId?: string;
  locationB: string;
  locationBPlaceId?: string;
  category: VenueCategory;
  customQuery?: string;
  preferences?: Preference[];
};

export type SearchHalfwayResponse = {
  originA: GeocodedLocation;
  originB: GeocodedLocation;
  midpoint: LatLng;
  category: VenueCategory;
  preferences: Preference[];
  query: string;
  venues: ScoredVenue[];
};
