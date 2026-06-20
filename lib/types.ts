export type LatLng = {
  lat: number;
  lng: number;
};

export type VenueCategory =
  | "antiques"
  | "american"
  | "asian"
  | "aquariums"
  | "arcades"
  | "activities"
  | "restaurant"
  | "bowling"
  | "bar"
  | "bbq"
  | "breakfast"
  | "breweries"
  | "brunch"
  | "business_finance"
  | "childrens_museums"
  | "cigar_lounges"
  | "coffee"
  | "college_towns"
  | "bookstore"
  | "colleges"
  | "cocktail_bars"
  | "downtowns"
  | "distilleries"
  | "dog_parks"
  | "driving_range"
  | "engineering_stem"
  | "events"
  | "escape_rooms"
  | "farmers_markets"
  | "family"
  | "gardens"
  | "golf"
  | "health_pre_med"
  | "hiking"
  | "hotels"
  | "home_design"
  | "indian"
  | "italian"
  | "liberal_arts"
  | "lounges"
  | "mediterranean"
  | "malls"
  | "mexican"
  | "museums"
  | "nature_preserves"
  | "outlets"
  | "pickleball"
  | "picnic_areas"
  | "pizza"
  | "park"
  | "playgrounds"
  | "pubs"
  | "rooftop_bars"
  | "scenic_spots"
  | "scenic_walks"
  | "seafood"
  | "shopping"
  | "small_towns"
  | "sports"
  | "sports_bars"
  | "steakhouse"
  | "sushi"
  | "thai"
  | "thrifting"
  | "trails"
  | "universities"
  | "urban_campuses"
  | "vegan"
  | "vintage"
  | "walkable_main_streets"
  | "waterfronts"
  | "wine_bars"
  | "zoos"
  | "dessert"
  | "custom";

export type MeetupMode = "single" | "district";

export type SearchMode = "single" | "midpoint";

export type KoiBotMode = "places" | "watch_events";

export type WatchEventsIntent = "stream" | "live_event" | "sports" | "things_to_do" | "general";

export type WatchEventsRecommendation = {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  kind: WatchEventsIntent;
  badge: string;
  explanation: string;
  tags: string[];
  meta: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionUrl: string;
  provider: string;
  preview: boolean;
  posterUrl?: string;
  year?: string;
  rating?: string;
  overview?: string;
  runtime?: string;
  mediaType?: "movie" | "tv";
  tmdbId?: number;
};

export type WatchEventsResult = {
  botMode: "watch_events";
  query: string;
  title: string;
  description: string;
  message: string;
  intent: WatchEventsIntent;
  intentLabel: string;
  location: string;
  timeframe: string;
  topic: string;
  contextSummary: string;
  resultCount: number;
  recommendations: WatchEventsRecommendation[];
  futureProviders: string[];
  preview: boolean;
  hasMore?: boolean;
};

export type WatchEventsMoreResult = {
  botMode: "watch_events";
  append: true;
  recommendations: WatchEventsRecommendation[];
  hasMore: boolean;
};

export type WatchEventsPlacesRedirect = {
  botMode: "places";
  form: SearchHalfwayRequest;
};

export type WatchEventsApiResponse = WatchEventsResult | WatchEventsPlacesRedirect | WatchEventsMoreResult;

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
  priceLevel?: string;
  reviewQuote?: string;
  reviewSummary?: string;
  reviewSummaryDisclosure?: string;
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
  locationACoordinates?: LatLng;
  locationB: string;
  locationBPlaceId?: string;
  locationBCoordinates?: LatLng;
  category: VenueCategory;
  searchMode?: SearchMode;
  meetupMode?: MeetupMode;
  customQuery?: string;
  preferences?: Preference[];
};

export type SearchHalfwayResponse = {
  originA: GeocodedLocation;
  originB: GeocodedLocation;
  midpoint: LatLng;
  category: VenueCategory;
  searchMode: SearchMode;
  meetupMode: MeetupMode;
  preferences: Preference[];
  query: string;
  venues: ScoredVenue[];
};
