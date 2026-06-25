import type { EventResult, LocalEventProfile } from "@/lib/eventResult";

export type { EventResult, LocalEventProfile } from "@/lib/eventResult";

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

export type MeetupMode = "single";

export type SearchMode = "single" | "midpoint";

/**
 * "Getting Around" travel mode — persistent user context (not a filter).
 * Influences recommendation ranking and future provider enrichment (e.g. EV
 * charging), never a separate search experience.
 *   - auto:    let Koi decide (defaults to drive-style behavior)
 *   - drive:   driving
 *   - ev:      electric vehicle — currently behaves like drive; reserved as the
 *              extension point for future EV charging enrichment
 *   - walk:    prefer closer results / penalize long distances
 *   - bike:    prefer reasonable bike-distance results when distance data exists
 */
export type ExploreTravelMode = "auto" | "drive" | "ev" | "walk" | "bike";
export type TravelMode = ExploreTravelMode;

export type KoiBotMode = "places" | "watch" | "events";

export type WatchSubcategory = "movies" | "tv_shows" | "trending";

export type WatchEventsIntent = "stream" | "live_event" | "sports" | "things_to_do" | "general";

export type NormalizedWatchProviders = {
  streaming: string[];
  free: string[];
  ads: string[];
  rent: string[];
  buy: string[];
};

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
  genre?: string;
  mediaType?: "movie" | "tv";
  tmdbId?: number;
  watchProviders?: NormalizedWatchProviders;
};

export type WatchEventsResult = {
  botMode: "watch" | "events";
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
  streamingServiceIds?: string[];
};

export type WatchEventsMoreResult = {
  botMode: "watch" | "events";
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

/**
 * EV charging context attached to a venue by the EV enrichment provider
 * (e.g. Open Charge Map) when the user is in EV travel mode. Optional — absent
 * when EV mode is off or no provider/key is configured.
 */
export type EvChargingInfo = {
  /** Chargers found within the "at this venue" radius. */
  nearbyCount: number;
  /** Straight-line meters to the closest charger, when known. */
  nearestDistanceMeters: number | null;
  /** Title/name of the closest charger, when known. */
  nearestName?: string;
  /** True when at least one nearby charger reports fast/rapid charging. */
  fastChargingAvailable: boolean;
};

/**
 * Short contextual blurb attached to a venue (e.g. from Wikipedia) when the user
 * asks why a place is interesting. Optional — absent for ordinary searches.
 */
export type PlaceInsight = {
  /** One or two sentence plain-text blurb. */
  blurb: string;
  /** Source article title. */
  title: string;
  /** Canonical source URL. */
  url: string;
  thumbnailUrl?: string;
  source: "wikipedia";
};

export type ScoredVenue = VenueCandidate & {
  travelFromA: RouteLeg;
  travelFromB: RouteLeg;
  timeDifferenceMinutes: number | null;
  totalTravelMinutes: number | null;
  fairnessScore: number;
  preferenceScore: number;
  preferenceMatches: Preference[];
  evCharging?: EvChargingInfo;
  insight?: PlaceInsight;
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
  watchSubcategory?: WatchSubcategory;
  preferences?: Preference[];
  travelMode?: TravelMode;
  /**
   * Raw natural-language query used only to detect "why is this place
   * interesting?" intent for Wikipedia enrichment. Does not affect place search.
   */
  insightQuery?: string;
  /** Parsed "near a trail/charger/park" relationship — not a geocodable location. */
  nearRelation?: import("@/lib/nearFeatureQuery").NearRelationIntent | null;
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
  events?: EventResult[];
  eventProfile?: LocalEventProfile;
  travelMode?: TravelMode;
};
