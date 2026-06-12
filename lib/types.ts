export type LatLng = {
  lat: number;
  lng: number;
};

export type VenueCategory =
  | "antiques"
  | "aquariums"
  | "arcades"
  | "activities"
  | "restaurant"
  | "bowling"
  | "bar"
  | "breweries"
  | "brunch"
  | "business_finance"
  | "childrens_museums"
  | "coffee"
  | "college_towns"
  | "bookstore"
  | "colleges"
  | "downtowns"
  | "driving_range"
  | "engineering_stem"
  | "events"
  | "escape_rooms"
  | "farmers_markets"
  | "family"
  | "golf"
  | "health_pre_med"
  | "hotels"
  | "home_design"
  | "liberal_arts"
  | "malls"
  | "museums"
  | "outlets"
  | "pickleball"
  | "park"
  | "playgrounds"
  | "scenic_spots"
  | "shopping"
  | "small_towns"
  | "sports"
  | "thrifting"
  | "universities"
  | "urban_campuses"
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
  | "outdoor_seating"
  | "upscale"
  | "family_friendly"
  | "scenic"
  | "quick_stop";

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
