import type {
  KoiBotMode,
  WatchEventsIntent,
  WatchEventsRecommendation,
  WatchEventsResult
} from "@/lib/types";

export const WATCH_EVENTS_TITLE = "Watch & Events";
export const WATCH_EVENTS_DESCRIPTION = "Find movies, sports, live events, and what to watch tonight.";
export const WATCH_EVENTS_PREVIEW_MESSAGE =
  "Preview results below are curated by Koi from your ask. Live listings and ticket data is coming soon.";

export const WATCH_EVENTS_FUTURE_PROVIDERS = [
  "TMDB",
  "Watchmode",
  "Streaming Availability API",
  "Ticketmaster",
  "SeatGeek",
  "ESPN",
  "SportsDataIO"
] as const;

const PLACE_MEETUP_PATTERN = /\b(?:between|halfway|midway|meet(?:up)?|halfway point)\b/i;
const PLACE_CATEGORY_PATTERN =
  /\b(?:coffee|cafe|restaurant|brunch|brewery|breweries|bar|bars|pizza|sushi|italian|mexican|thai|indian|steakhouse|bookstore|bowling|park(?:ing)?|hiking|hotel|mall|shopping)\b/i;
const SHOW_ME_PLACES_PATTERN =
  /\bshow me\b.*\b(?:coffee|restaurant|place|spot|bar|brewery|food|lunch|dinner|brunch|hotel|park)\b/i;

const STRONG_WATCH_EVENTS_PATTERNS = [
  /\bwhat (?:should|can|do) (?:i|we) watch\b/i,
  /\bwhere (?:can|to|should) (?:i|we) (?:watch|stream)\b/i,
  /\bwhat(?:'s| is) on (?:tv|television)\b/i,
  /\b(?:stream(?:ing)?|watch(?:ing)?) (?:on|via)\b/i,
  /\b(?:movie|movies|film|films|tv show|tv shows|television show)\b/i,
  /\b(?:comedy|concert|concerts|stand[- ]?up|festival|festivals)\b/i,
  /\b(?:live sports|sports on tv|game tonight|watch the .* game|watch .* game tonight)\b/i,
  /\b(?:tickets?|box office)\b/i,
  /\bfamily[- ]friendly events\b/i,
  /\blocal events\b/i,
  /\bevents near\b/i,
  /\bthings to do\b/i,
  /\bthis weekend\b.*\b(?:show|shows|concert|comedy|event|events|game)\b/i,
  /\b(?:show|shows|concert|comedy|event|events|game)\b.*\bthis weekend\b/i
];

const WATCH_EVENTS_KEYWORDS =
  /\b(?:watch|stream|streaming|movie|movies|film|concert|comedy|festival|tickets?|tv|television|game tonight|on tv|events)\b/i;

const INTENT_LABELS: Record<WatchEventsIntent, string> = {
  stream: "Streaming",
  live_event: "Live events",
  sports: "Sports",
  things_to_do: "Things to do",
  general: "Tonight's picks"
};

export function detectWatchEventsIntent(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (SHOW_ME_PLACES_PATTERN.test(trimmed)) return false;

  if (STRONG_WATCH_EVENTS_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (
      PLACE_MEETUP_PATTERN.test(trimmed) &&
      PLACE_CATEGORY_PATTERN.test(trimmed) &&
      !/\b(?:show|concert|comedy|game|stream|watch)\b/i.test(trimmed)
    ) {
      return false;
    }
    return true;
  }

  if (/\bwhere can i watch\b/i.test(trimmed)) return true;
  if (/\bstream\b/i.test(trimmed)) return true;

  if (
    WATCH_EVENTS_KEYWORDS.test(trimmed) &&
    /\bnear\b/i.test(trimmed) &&
    /\b(?:show|shows|concert|comedy|event|events|game)\b/i.test(trimmed)
  ) {
    return true;
  }

  return false;
}

export function resolveKoiBotMode(query: string, requestedMode?: KoiBotMode): KoiBotMode {
  if (requestedMode === "watch_events") return "watch_events";
  if (detectWatchEventsIntent(query)) return "watch_events";
  return "places";
}

export function buildWatchEventsResult(query: string): WatchEventsResult {
  const trimmed = query.trim();
  const intent = classifyWatchEventsIntent(trimmed);
  const location = extractWatchEventsLocation(trimmed);
  const timeframe = extractWatchEventsTimeframe(trimmed);
  const topic = extractWatchEventsTopic(trimmed, intent);
  const recommendations = buildWatchEventsRecommendations({ query: trimmed, intent, location, timeframe, topic });
  const contextSummary = buildContextSummary({ intent, location, timeframe, topic });

  return {
    botMode: "watch_events",
    query: trimmed,
    title: WATCH_EVENTS_TITLE,
    description: WATCH_EVENTS_DESCRIPTION,
    message: WATCH_EVENTS_PREVIEW_MESSAGE,
    intent,
    intentLabel: INTENT_LABELS[intent],
    location,
    timeframe,
    topic,
    contextSummary,
    resultCount: recommendations.length,
    recommendations,
    futureProviders: [...WATCH_EVENTS_FUTURE_PROVIDERS],
    preview: true
  };
}

function classifyWatchEventsIntent(query: string): WatchEventsIntent {
  const value = query.toLowerCase();

  if (/\b(?:game tonight|watch the .* game|sports on tv|phillies|yankees|eagles|nba|nfl|mlb|nhl|football|baseball|soccer)\b/i.test(value)) {
    return "sports";
  }

  if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(value)) {
    return "general";
  }

  if (
    /\b(?:drama|sci-fi|science fiction|comedy|action|horror|romance|thriller|documentary|family)\b/i.test(value) &&
    /\b(?:movie|movies|film|films|tonight)\b/i.test(value)
  ) {
    return "general";
  }

  if (/\b(?:comedy show|stand[- ]?up|concert|concerts|festival|festivals|tickets?|box office)\b/i.test(value)) {
    return "live_event";
  }

  if (/\b(?:family[- ]friendly events|things to do|local events|events near)\b/i.test(value)) {
    return "things_to_do";
  }

  if (/\b(?:stream|streaming|where can i stream)\b/i.test(value)) {
    return "stream";
  }

  if (/\bwhat (?:should|can|do) (?:i|we) watch\b/i.test(value) || /\bwhat(?:'s| is) on (?:tv|television)\b/i.test(value)) {
    return "general";
  }

  if (/\bnear\b/i.test(value) && /\b(?:show|shows|event|events|game)\b/i.test(value)) {
    return "live_event";
  }

  if (/\b(?:movie|movies|film|films|tv show)\b/i.test(value) && !/\bgame\b/i.test(value)) {
    return "general";
  }

  return "general";
}

function extractWatchEventsLocation(query: string) {
  const patterns = [
    /\bnear\s+(.+?)(?:\s+(?:this|on|with|for|that|where|tonight|today|tomorrow|saturday|sunday|weekend)\b|[?.!,]|$)/i,
    /\bin\s+(.+?)(?:\s+(?:this|on|with|for|that|where|tonight|today|tomorrow|saturday|sunday|weekend)\b|[?.!,]|$)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) {
      const location = cleanupWatchEventsFragment(match[1]);
      if (location && !/^me$/i.test(location)) return location;
    }
  }

  if (/\bnear me\b/i.test(query)) return "near you";

  return "";
}

function extractWatchEventsTimeframe(query: string) {
  const patterns: Array<[RegExp, string]> = [
    [/\bthis weekend\b/i, "This weekend"],
    [/\btonight\b/i, "Tonight"],
    [/\btoday\b/i, "Today"],
    [/\btomorrow\b/i, "Tomorrow"],
    [/\bsaturday\b/i, "Saturday"],
    [/\bsunday\b/i, "Sunday"],
    [/\bthis month\b/i, "This month"]
  ];

  for (const [pattern, label] of patterns) {
    if (pattern.test(query)) return label;
  }

  return "Soon";
}

function extractWatchEventsTopic(query: string, intent: WatchEventsIntent) {
  const streamMatch = query.match(/\bstream(?:ing)?\s+(.+?)(?:\?|$)/i);
  if (streamMatch?.[1]) return cleanupWatchEventsFragment(streamMatch[1]);

  const watchMatch = query.match(/\bwatch(?:ing)?\s+(?:the\s+)?(.+?)(?:\s+game\b|\?|$)/i);
  if (watchMatch?.[1] && intent === "sports") return cleanupWatchEventsFragment(watchMatch[1]);

  if (/\bcomedy\b/i.test(query) && !/\b(?:movie|movies|film)\b/i.test(query)) return "comedy";
  if (/\bconcert/i.test(query)) return "concerts";
  if (/\bfamily[- ]friendly events\b/i.test(query)) return "family-friendly events";
  if (/\bthings to do\b/i.test(query)) return "things to do";

  const genre = extractMovieGenre(query);
  if (genre) return genre;

  return "";
}

function extractMovieGenre(query: string) {
  const match = query.match(
    /\b(drama|sci-fi|science fiction|comedy|action|horror|romance|thriller|documentary|family)\b/i
  );
  if (!match?.[1]) return "";
  return match[1].toLowerCase() === "science fiction" ? "sci-fi" : match[1].toLowerCase();
}

function buildContextSummary({
  intent,
  location,
  timeframe,
  topic
}: {
  intent: WatchEventsIntent;
  location: string;
  timeframe: string;
  topic: string;
}) {
  const parts = [INTENT_LABELS[intent]];
  if (topic) parts.push(topic);
  if (location) parts.push(location);
  if (timeframe) parts.push(timeframe);
  return parts.join(" · ");
}

function buildWatchEventsRecommendations({
  query,
  intent,
  location,
  timeframe,
  topic
}: {
  query: string;
  intent: WatchEventsIntent;
  location: string;
  timeframe: string;
  topic: string;
}) {
  switch (intent) {
    case "stream":
      return buildStreamRecommendations(topic || "movies");
    case "live_event":
      return buildLiveEventRecommendations(location || "your area", topic || "live events", timeframe);
    case "sports":
      return buildSportsRecommendations(topic || "local team", location, timeframe);
    case "things_to_do":
      return buildThingsToDoRecommendations(location || "your area", topic || "events", timeframe);
    default:
      if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(query)) {
        return buildMovieTheaterRecommendations(location || "near you", timeframe);
      }
      if (extractMovieGenre(query)) {
        return buildMovieGenreRecommendations(extractMovieGenre(query), timeframe);
      }
      return buildGeneralRecommendations(query, timeframe);
  }
}

function buildStreamRecommendations(topic: string) {
  const title = capitalizeWords(topic);
  return [
    recommendation({
      rank: 1,
      title,
      subtitle: "Likely streaming options to check first",
      kind: "stream",
      badge: "Best streaming match",
      explanation: `Koi matched your ask to ${title} and surfaced the most common places people check first for streaming availability.`,
      tags: ["Streaming", "On-demand", "Tonight"],
      meta: [
        { label: "Format", value: "Movie / show" },
        { label: "When", value: "Watch now" },
        { label: "Next data", value: "Watchmode + TMDB" }
      ],
      actionLabel: "Check streaming options",
      actionUrl: buildJustWatchUrl(title),
      provider: "JustWatch preview"
    }),
    recommendation({
      rank: 2,
      title: "Similar sci-fi picks",
      subtitle: "If you want the same mood tonight",
      kind: "stream",
      badge: "Same vibe",
      explanation: "A strong backup lane when you want something ambitious, visual, and easy to start tonight.",
      tags: ["Sci-fi", "Highly rated", "Long watch"],
      meta: [
        { label: "Examples", value: "Arrival, Contact, Dune" },
        { label: "When", value: "Tonight" }
      ],
      actionLabel: "Browse similar titles",
      actionUrl: buildGoogleSearchUrl(`sci-fi movies like ${title} streaming tonight`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 3,
      title: "Short watch backup",
      subtitle: "Easier option if you do not want a long movie",
      kind: "stream",
      badge: "Quick option",
      explanation: "Useful when the group wants something lighter or shorter before committing to a full film.",
      tags: ["Shorter runtime", "Easy start"],
      meta: [
        { label: "Format", value: "Series or film" },
        { label: "When", value: "Tonight" }
      ],
      actionLabel: "Find a shorter pick",
      actionUrl: buildGoogleSearchUrl(`good short movies to stream tonight`),
      provider: "Koi preview"
    })
  ];
}

function buildLiveEventRecommendations(location: string, topic: string, timeframe: string) {
  const area = location === "near you" ? "near you" : `in ${location}`;
  const label = topic.includes("comedy") ? "Comedy" : capitalizeWords(topic);

  return [
    recommendation({
      rank: 1,
      title: `${label} showcase ${area}`,
      subtitle: `${timeframe} · Live event preview`,
      kind: "live_event",
      badge: "Best event match",
      explanation: `Koi read this as a live ${label.toLowerCase()} search ${area} for ${timeframe.toLowerCase()} and ranked the most actionable event-style options first.`,
      tags: [label, timeframe, location ? "Nearby" : "Local"],
      meta: [
        { label: "Area", value: location || "Add a city for sharper results" },
        { label: "Timing", value: timeframe },
        { label: "Next data", value: "Ticketmaster + SeatGeek" }
      ],
      actionLabel: "Search live events",
      actionUrl: buildGoogleSearchUrl(`${label.toLowerCase()} shows ${location} ${timeframe}`),
      provider: "Ticketmaster preview"
    }),
    recommendation({
      rank: 2,
      title: "Stand-up room or comedy club",
      subtitle: "Good when you want a definite plan",
      kind: "live_event",
      badge: "Easy plan",
      explanation: "A venue-style option works well when you want tickets, a start time, and a clear place to meet.",
      tags: ["Tickets", "Night out", "Indoor"],
      meta: [
        { label: "Format", value: "Live show" },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "Browse venues",
      actionUrl: buildGoogleSearchUrl(`comedy clubs ${location}`),
      provider: "SeatGeek preview"
    }),
    recommendation({
      rank: 3,
      title: "Late show or second performance",
      subtitle: "Backup if the early show sells out",
      kind: "live_event",
      badge: "Backup plan",
      explanation: "Helpful when the first event is sold out or the group needs a later start time.",
      tags: ["Flexible timing", "Backup plan"],
      meta: [
        { label: "Timing", value: "Late show" },
        { label: "Area", value: location || "Near you" }
      ],
      actionLabel: "See late options",
      actionUrl: buildGoogleSearchUrl(`late comedy shows ${location} ${timeframe}`),
      provider: "Koi preview"
    })
  ];
}

function buildSportsRecommendations(team: string, location: string, timeframe: string) {
  const teamLabel = capitalizeWords(team.replace(/\bgame\b/i, "").trim() || "Local team");

  return [
    recommendation({
      rank: 1,
      title: `${teamLabel} broadcast`,
      subtitle: `${timeframe} · TV / streaming preview`,
      kind: "sports",
      badge: "Best watch option",
      explanation: `Koi interpreted this as a ${teamLabel} watch plan and prioritized the most likely broadcast and streaming paths first.`,
      tags: ["Live sports", timeframe, "Watch plan"],
      meta: [
        { label: "Team", value: teamLabel },
        { label: "Timing", value: timeframe },
        { label: "Next data", value: "ESPN + SportsDataIO" }
      ],
      actionLabel: "Find where to watch",
      actionUrl: buildGoogleSearchUrl(`where to watch ${teamLabel} game ${timeframe}`),
      provider: "ESPN preview"
    }),
    recommendation({
      rank: 2,
      title: "Sports bar watch party",
      subtitle: location ? `Near ${location}` : "Near you",
      kind: "sports",
      badge: "Meetup-friendly",
      explanation: "A strong fallback when the group wants a social plan instead of figuring out the exact channel at home.",
      tags: ["Group-friendly", "Out of home", "Live atmosphere"],
      meta: [
        { label: "Plan type", value: "Watch party" },
        { label: "Area", value: location || "Near you" }
      ],
      actionLabel: "Find sports bars",
      actionUrl: buildGoogleSearchUrl(`sports bars showing ${teamLabel} ${location}`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 3,
      title: "League pass / stream backup",
      subtitle: "If the game is out-of-market",
      kind: "sports",
      badge: "Streaming backup",
      explanation: "Useful when local TV does not carry the game and you need a streaming-service fallback.",
      tags: ["Streaming", "Backup", "Out-of-market"],
      meta: [
        { label: "Format", value: "Stream" },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "Check stream services",
      actionUrl: buildGoogleSearchUrl(`${teamLabel} stream ${timeframe}`),
      provider: "SportsDataIO preview"
    })
  ];
}

function buildThingsToDoRecommendations(location: string, topic: string, timeframe: string) {
  const area = location === "near you" ? "near you" : `in ${location}`;

  return [
    recommendation({
      rank: 1,
      title: capitalizeWords(topic),
      subtitle: `${timeframe} ${area}`,
      kind: "things_to_do",
      badge: "Best fit",
      explanation: `Koi grouped this as a family-friendly or general event search ${area} for ${timeframe.toLowerCase()}.`,
      tags: ["Events", timeframe, "Local"],
      meta: [
        { label: "Area", value: location || "Near you" },
        { label: "Timing", value: timeframe },
        { label: "Next data", value: "Ticketmaster" }
      ],
      actionLabel: "Browse events",
      actionUrl: buildGoogleSearchUrl(`${topic} ${location} ${timeframe}`),
      provider: "Ticketmaster preview"
    }),
    recommendation({
      rank: 2,
      title: "Museum or indoor activity",
      subtitle: "Reliable fallback in any weather",
      kind: "things_to_do",
      badge: "Weather-safe",
      explanation: "A practical backup when the group wants something structured, timed, and easy to share.",
      tags: ["Family-friendly", "Indoor", "Timed entry"],
      meta: [
        { label: "Plan type", value: "Activity" },
        { label: "Area", value: location || "Near you" }
      ],
      actionLabel: "Find activities",
      actionUrl: buildGoogleSearchUrl(`family activities ${location} ${timeframe}`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 3,
      title: "Outdoor festival or market",
      subtitle: "Higher-energy option if the weather cooperates",
      kind: "things_to_do",
      badge: "Weekend energy",
      explanation: "Good when the group wants something more open-ended and less ticket-specific.",
      tags: ["Outdoor", "Weekend", "Flexible"],
      meta: [
        { label: "Timing", value: timeframe },
        { label: "Area", value: location || "Near you" }
      ],
      actionLabel: "See local listings",
      actionUrl: buildGoogleSearchUrl(`local festivals ${location} ${timeframe}`),
      provider: "Koi preview"
    })
  ];
}

function buildMovieGenreRecommendations(genre: string, timeframe: string) {
  const label = genre === "sci-fi" ? "Sci-Fi" : capitalizeWords(genre);

  return [
    recommendation({
      rank: 1,
      title: `Top ${label.toLowerCase()} pick tonight`,
      subtitle: `${timeframe} · Movie night`,
      kind: "general",
      badge: "Best genre match",
      explanation: `Koi matched this to a ${label.toLowerCase()} movie search and surfaced strong tonight picks in that genre first.`,
      tags: [label, timeframe, "Movie night"],
      meta: [
        { label: "Genre", value: label },
        { label: "Timing", value: timeframe },
        { label: "Next data", value: "TMDB" }
      ],
      actionLabel: `Browse ${label.toLowerCase()} picks`,
      actionUrl: buildGoogleSearchUrl(`best ${label.toLowerCase()} movies tonight`),
      provider: "TMDB preview"
    }),
    recommendation({
      rank: 2,
      title: `Critically acclaimed ${label.toLowerCase()}`,
      subtitle: "When you want something with strong reviews",
      kind: "general",
      badge: "Highly rated",
      explanation: `A good second lane when the group wants a ${label.toLowerCase()} film that feels worth the runtime.`,
      tags: [label, "Highly rated", "Tonight"],
      meta: [
        { label: "Genre", value: label },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "See top-rated options",
      actionUrl: buildGoogleSearchUrl(`highly rated ${label.toLowerCase()} movies`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 3,
      title: `Shorter ${label.toLowerCase()} option`,
      subtitle: "Easier pick if nobody wants a long film",
      kind: "general",
      badge: "Quick option",
      explanation: "Useful when the group wants the right genre mood without committing to a three-hour movie.",
      tags: [label, "Shorter runtime", "Easy start"],
      meta: [
        { label: "Genre", value: label },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "Find a shorter pick",
      actionUrl: buildGoogleSearchUrl(`short ${label.toLowerCase()} movies under 2 hours`),
      provider: "Koi preview"
    })
  ];
}

function buildMovieTheaterRecommendations(location: string, timeframe: string) {
  const area = location === "near you" ? "near you" : `near ${location}`;

  return [
    recommendation({
      rank: 1,
      title: "Movie theater nearby",
      subtitle: `${timeframe} · Out to watch`,
      kind: "general",
      badge: "Best theater match",
      explanation: `Koi read this as a movie theater search ${area} and prioritized easy out-of-home options first.`,
      tags: ["Movie theater", timeframe, "Out tonight"],
      meta: [
        { label: "Area", value: location },
        { label: "Timing", value: timeframe },
        { label: "Plan type", value: "Out to watch" }
      ],
      actionLabel: "Find movie theaters",
      actionUrl: buildGoogleSearchUrl(`movie theaters ${location} showtimes ${timeframe.toLowerCase()}`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 2,
      title: "New releases in theaters",
      subtitle: "If the group wants something current",
      kind: "general",
      badge: "Now playing",
      explanation: "A strong backup when you want a definite plan with showtimes instead of picking a title at home.",
      tags: ["Now playing", "New releases", timeframe],
      meta: [
        { label: "Area", value: location },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "See new releases",
      actionUrl: buildGoogleSearchUrl(`new movies in theaters ${location}`),
      provider: "Koi preview"
    }),
    recommendation({
      rank: 3,
      title: "Dinner and a movie",
      subtitle: "Easy meetup plan nearby",
      kind: "general",
      badge: "Meetup-friendly",
      explanation: "Helpful when the group wants a full night out with food and a film in the same area.",
      tags: ["Dinner + movie", "Group-friendly", "Night out"],
      meta: [
        { label: "Area", value: location },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "Plan dinner and a movie",
      actionUrl: buildGoogleSearchUrl(`restaurants near movie theater ${location}`),
      provider: "Koi preview"
    })
  ];
}

function buildGeneralRecommendations(query: string, timeframe: string) {
  return [
    recommendation({
      rank: 1,
      title: "Top streaming pick tonight",
      subtitle: "Balanced crowd-pleaser",
      kind: "general",
      badge: "Tonight's pick",
      explanation: "When the ask is broad, Koi starts with a high-confidence option that is easy for a group to agree on quickly.",
      tags: ["Tonight", "Easy pick", "Streaming"],
      meta: [
        { label: "Timing", value: timeframe },
        { label: "Next data", value: "Watchmode + TMDB" }
      ],
      actionLabel: "Browse tonight's picks",
      actionUrl: buildGoogleSearchUrl("best movies to watch tonight streaming"),
      provider: "Watchmode preview"
    }),
    recommendation({
      rank: 2,
      title: "New release or trending series",
      subtitle: "If the group wants something current",
      kind: "general",
      badge: "Trending",
      explanation: "A good second lane when nobody wants to rewatch and you want something that feels fresh.",
      tags: ["Trending", "New", "Series"],
      meta: [
        { label: "Format", value: "Film or series" },
        { label: "Timing", value: timeframe }
      ],
      actionLabel: "See trending options",
      actionUrl: buildGoogleSearchUrl("trending movies and shows tonight"),
      provider: "TMDB preview"
    }),
    recommendation({
      rank: 3,
      title: "Comfort rewatch",
      subtitle: "Fastest path when decision fatigue hits",
      kind: "general",
      badge: "Low-friction",
      explanation: `Koi keeps a low-friction backup ready for asks like "${query}" when the group just wants to start watching.`,
      tags: ["Comfort watch", "Quick decision"],
      meta: [
        { label: "Timing", value: timeframe },
        { label: "Plan type", value: "Stay in" }
      ],
      actionLabel: "Find a comfort pick",
      actionUrl: buildGoogleSearchUrl("popular comfort movies to rewatch tonight"),
      provider: "Koi preview"
    })
  ];
}

function recommendation(
  input: Omit<WatchEventsRecommendation, "id" | "preview"> & { rank: number }
): WatchEventsRecommendation {
  return {
    ...input,
    id: `watch-events-${input.kind}-${input.rank}`,
    preview: true
  };
}

function cleanupWatchEventsFragment(value: string) {
  return value
    .replace(/\b(with|for|that|where|open|easy|family|friendly)\b.*$/i, "")
    .replace(/[?.!,]+$/g, "")
    .trim();
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildGoogleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildJustWatchUrl(title: string) {
  return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
}
