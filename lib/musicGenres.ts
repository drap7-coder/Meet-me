export type MusicGenreId =
  | "rock"
  | "pop"
  | "hip_hop"
  | "country"
  | "jazz"
  | "electronic"
  | "rnb"
  | "latin"
  | "classical"
  | "alternative";

export type MusicGenreDefinition = {
  id: MusicGenreId;
  label: string;
  emoji: string;
  /** Ticketmaster Music genre classification name. */
  ticketmasterClassification: string;
  /** Natural-language token for built queries (e.g. "rock concerts near me"). */
  queryWord: string;
};

export const MUSIC_GENRES: MusicGenreDefinition[] = [
  { id: "rock", label: "Rock", emoji: "🎸", ticketmasterClassification: "Rock", queryWord: "rock" },
  { id: "pop", label: "Pop", emoji: "🎤", ticketmasterClassification: "Pop", queryWord: "pop" },
  {
    id: "hip_hop",
    label: "Hip-Hop",
    emoji: "🎧",
    ticketmasterClassification: "Hip-Hop/Rap",
    queryWord: "hip-hop"
  },
  { id: "country", label: "Country", emoji: "🤠", ticketmasterClassification: "Country", queryWord: "country" },
  { id: "jazz", label: "Jazz", emoji: "🎷", ticketmasterClassification: "Jazz", queryWord: "jazz" },
  {
    id: "electronic",
    label: "Electronic",
    emoji: "🪩",
    ticketmasterClassification: "Dance/Electronic",
    queryWord: "electronic"
  },
  { id: "rnb", label: "R&B", emoji: "💿", ticketmasterClassification: "R&B", queryWord: "r&b" },
  { id: "latin", label: "Latin", emoji: "💃", ticketmasterClassification: "Latin", queryWord: "latin" },
  {
    id: "classical",
    label: "Classical",
    emoji: "🎻",
    ticketmasterClassification: "Classical",
    queryWord: "classical"
  },
  {
    id: "alternative",
    label: "Alternative",
    emoji: "🌙",
    ticketmasterClassification: "Alternative",
    queryWord: "alternative"
  }
];

const GENRE_BY_ID = new Map(MUSIC_GENRES.map((genre) => [genre.id, genre]));

/** Genre tokens count with explicit live-music wording. */
const MUSIC_GENRE_CONTEXT_PATTERN = /\b(?:concerts?|live music|gigs?|music events?)\b/i;

/** Genre + local discovery wording ("jazz near me") without requiring "concert". */
const MUSIC_GENRE_NEAR_PATTERN =
  /\b(?:near me|nearby|around me|in town|this weekend|tonight|today|saturday|sunday|weekend|\bnear\b)\b/i;

/** Block genre tokens that double as food/place asks (e.g. "country restaurants"). */
const PLACE_OR_FOOD_CONTEXT =
  /\b(?:restaurant|restaurants|cafe|cafes|coffee|bar|bars|pub|pubs|food|dining|breakfast|brunch|lunch|dinner|store|stores|shop|shops|shopping|mall|market|cooking|cuisine|kitchen|bakery|brewery|breweries|pizza|sushi|thai|mexican|italian|steakhouse|bbq)\b/i;

function findMatchingGenre(query: string): MusicGenreDefinition | null {
  for (const genre of MUSIC_GENRES) {
    if (genreQueryPatterns(genre).some((pattern) => pattern.test(query))) {
      return genre;
    }
  }
  return null;
}

function isGenreNearDiscoveryQuery(query: string, genre: MusicGenreDefinition): boolean {
  if (!MUSIC_GENRE_NEAR_PATTERN.test(query)) return false;
  if (PLACE_OR_FOOD_CONTEXT.test(query)) return false;
  if (genre.id === "rock" && /\b(?:climb|climbing|gym|gyms)\b/i.test(query)) return false;
  return true;
}

export function musicGenreById(id: string | null | undefined): MusicGenreDefinition | null {
  if (!id) return null;
  return GENRE_BY_ID.get(id as MusicGenreId) ?? null;
}

export function musicGenreChipLabel(id: string): string {
  const genre = musicGenreById(id);
  if (!genre) return id;
  return `${genre.emoji} ${genre.label}`;
}

function genreQueryPatterns(genre: MusicGenreDefinition): RegExp[] {
  const word = genre.queryWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [new RegExp(`\\b${word}\\b`, "i")];

  if (genre.id === "hip_hop") {
    patterns.push(/\b(?:hip[- ]hop|rap)\b/i);
  }
  if (genre.id === "electronic") {
    patterns.push(/\b(?:edm|dance music)\b/i);
  }
  if (genre.id === "rnb") {
    patterns.push(/\br\s*&\s*b\b/i);
  }

  return patterns;
}

/** Match a Ticketmaster music genre from a freeform or chip-built query. */
export function extractMusicGenreFromQuery(query: string): MusicGenreDefinition | null {
  const value = query.trim();
  if (!value) return null;

  const genre = findMatchingGenre(value);
  if (!genre) return null;

  if (MUSIC_GENRE_CONTEXT_PATTERN.test(value)) return genre;
  if (isGenreNearDiscoveryQuery(value, genre)) return genre;

  return null;
}

/**
 * Match every music genre present in a query (e.g. "rock, jazz concerts near me").
 * Honors the same concert/discovery context guard as the single-genre extractor.
 */
export function extractMusicGenresFromQuery(query: string): MusicGenreDefinition[] {
  const value = query.trim();
  if (!value) return [];

  const matches = MUSIC_GENRES.filter((genre) =>
    genreQueryPatterns(genre).some((pattern) => pattern.test(value))
  );
  if (!matches.length) return [];

  const hasContext = MUSIC_GENRE_CONTEXT_PATTERN.test(value);
  return matches.filter((genre) => hasContext || isGenreNearDiscoveryQuery(value, genre));
}
