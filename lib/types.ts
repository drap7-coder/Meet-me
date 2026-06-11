export type LatLng = {
  lat: number;
  lng: number;
};

export type VenueCategory =
  | "antiques"
  | "aquariums"
  | "arcades"
  | "restaurant"
  | "bowling"
  | "bar"
  | "breweries"
  | "brunch"
  | "childrens_museums"
  | "coffee"
  | "bookstore"
  | "downtowns"
  | "driving_range"
  | "escape_rooms"
  | "farmers_markets"
  | "golf"
  | "home_design"
  | "malls"
  | "outlets"
  | "pickleball"
  | "park"
  | "playgrounds"
  | "scenic_spots"
  | "small_towns"
  | "thrifting"
  | "vintage"
  | "walkable_main_streets"
  | "waterfronts"
  | "wine_bars"
  | "zoos"
  | "dessert"
  | "custom";

export type MeetupMode = "single" | "district";

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
  meetupMode?: MeetupMode;
  customQuery?: string;
  preferences?: Preference[];
};

export type SearchHalfwayResponse = {
  originA: GeocodedLocation;
  originB: GeocodedLocation;
  midpoint: LatLng;
  category: VenueCategory;
  meetupMode: MeetupMode;
  preferences: Preference[];
  query: string;
  venues: ScoredVenue[];
};
