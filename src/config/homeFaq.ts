/** Provider tags — extend when new integrations ship; FAQs reference these in config. */
export type HomeFaqIntegration =
  | "google_places"
  | "ticketmaster"
  | "tmdb"
  | "opentripmap"
  | "openchargemap"
  | "national_parks"
  | "weather"
  | "openstreetmap";

export type HomeFaqItem = {
  id: string;
  question: string;
  answer: string;
  integrations: HomeFaqIntegration[];
  /** Shown before “Show more” — keep 2–3 featured for a lighter default footprint. */
  featured?: boolean;
};

export const HOME_FAQ_INITIAL_VISIBLE = 3;

export const HOME_FAQ_ITEMS: HomeFaqItem[] = [
  {
    id: "halfway_restaurants",
    question: "Best restaurants halfway between two locations",
    answer:
      "Tell Koi both starting points and the kind of food you want. Koi finds spots near the midpoint and compares drive times so the meetup feels fair for everyone.",
    integrations: ["google_places"],
    featured: true
  },
  {
    id: "weekend_near_me",
    question: "Things to do this weekend near me",
    answer:
      "Ask for weekend plans near your location. Koi blends live events, local places, and outdoor ideas — and shows trending picks on the homepage when your location is set.",
    integrations: ["ticketmaster", "google_places", "opentripmap"],
    featured: true
  },
  {
    id: "concerts_near_me",
    question: "Find concerts near me",
    answer:
      "Search for concerts, comedy, or live music near you. Koi routes live-event asks to ticket listings and surfaces shows happening this weekend nearby.",
    integrations: ["ticketmaster"],
    featured: true
  },
  {
    id: "stream_movie",
    question: "Where can I stream this movie?",
    answer:
      "Ask Koi where to watch a title or describe the mood you want. Pick Streaming for movie and TV recommendations, including what's trending and which services carry a pick.",
    integrations: ["tmdb"]
  },
  {
    id: "date_night",
    question: "Best date night ideas",
    answer:
      "Try date-night restaurants, cocktail bars, live shows, or a spot halfway between you. Mention the vibe — upscale, outdoor seating, or something low-key — and Koi narrows the list.",
    integrations: ["google_places", "ticketmaster"]
  },
  {
    id: "ev_chargers",
    question: "EV chargers near me",
    answer:
      "Switch Getting around to EV Charging and search for restaurants or stops that work for your drive. Koi can highlight places with nearby fast charging when charging data is available.",
    integrations: ["openchargemap", "google_places"]
  },
  {
    id: "farmers_markets",
    question: "Farmers markets this weekend",
    answer:
      "Ask for farmers markets near you or pick Outdoors on Explore. Koi finds market-style places and seasonal outdoor spots — confirm hours before you go.",
    integrations: ["google_places", "opentripmap"]
  },
  {
    id: "dog_friendly",
    question: "Dog-friendly restaurants nearby",
    answer:
      "Search for dog-friendly patios or parks near you. Koi uses your location to rank nearby places that match outdoor and pet-friendly asks.",
    integrations: ["google_places"]
  }
];

export function homeFaqPageJsonLd(items: HomeFaqItem[] = HOME_FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

/** FAQs to add when an integration becomes available — merge in app code later if needed. */
export function homeFaqItemsForIntegrations(active: Set<HomeFaqIntegration>): HomeFaqItem[] {
  return HOME_FAQ_ITEMS.filter((item) => item.integrations.some((key) => active.has(key)));
}
