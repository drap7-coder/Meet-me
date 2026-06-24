import { extractMusicGenreFromQuery } from "@/lib/musicGenres";

export type MusicArtistDefinition = {
  id: string;
  label: string;
  searchTerm: string;
  ticketmasterKeyword: string;
};

export type MusicArtistMatch = {
  label: string;
  ticketmasterKeyword: string;
};

export const MUSIC_ARTISTS: MusicArtistDefinition[] = [
  { id: "taylor_swift", label: "Taylor Swift", searchTerm: "Taylor Swift", ticketmasterKeyword: "Taylor Swift" },
  { id: "beyonce", label: "Beyoncé", searchTerm: "Beyoncé", ticketmasterKeyword: "Beyonce" },
  { id: "drake", label: "Drake", searchTerm: "Drake", ticketmasterKeyword: "Drake" },
  { id: "bad_bunny", label: "Bad Bunny", searchTerm: "Bad Bunny", ticketmasterKeyword: "Bad Bunny" },
  { id: "billie_eilish", label: "Billie Eilish", searchTerm: "Billie Eilish", ticketmasterKeyword: "Billie Eilish" },
  { id: "coldplay", label: "Coldplay", searchTerm: "Coldplay", ticketmasterKeyword: "Coldplay" },
  { id: "ed_sheeran", label: "Ed Sheeran", searchTerm: "Ed Sheeran", ticketmasterKeyword: "Ed Sheeran" },
  { id: "harry_styles", label: "Harry Styles", searchTerm: "Harry Styles", ticketmasterKeyword: "Harry Styles" },
  { id: "the_weeknd", label: "The Weeknd", searchTerm: "The Weeknd", ticketmasterKeyword: "The Weeknd" },
  { id: "olivia_rodrigo", label: "Olivia Rodrigo", searchTerm: "Olivia Rodrigo", ticketmasterKeyword: "Olivia Rodrigo" },
  { id: "kendrick_lamar", label: "Kendrick Lamar", searchTerm: "Kendrick Lamar", ticketmasterKeyword: "Kendrick Lamar" },
  { id: "bruce_springsteen", label: "Bruce Springsteen", searchTerm: "Bruce Springsteen", ticketmasterKeyword: "Bruce Springsteen" }
];

const ARTIST_BY_ID = new Map(MUSIC_ARTISTS.map((artist) => [artist.id, artist]));

const MUSIC_ARTIST_CONTEXT_PATTERN = /\b(?:concert|concerts|tickets?|tour|live|gigs?|shows?)\b/i;

const GENERIC_ARTIST_STOP_WORDS = new Set([
  "a",
  "an",
  "any",
  "best",
  "comedy",
  "concert",
  "concerts",
  "country",
  "electronic",
  "family",
  "festival",
  "festivals",
  "find",
  "good",
  "hip",
  "hop",
  "jazz",
  "live",
  "local",
  "music",
  "near",
  "pop",
  "rap",
  "rock",
  "see",
  "show",
  "shows",
  "the",
  "this",
  "ticket",
  "tickets",
  "tour",
  "watch",
  "what",
  "where"
]);

export function musicArtistById(id: string | null | undefined): MusicArtistDefinition | null {
  if (!id) return null;
  return ARTIST_BY_ID.get(id) ?? null;
}

export function musicArtistChipLabel(id: string): string {
  return musicArtistById(id)?.label ?? id;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeArtistText(value: string) {
  return value
    .replace(/\bnear me\b/gi, " ")
    .replace(/\bthis weekend\b/gi, " ")
    .replace(/\btonight\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveKnownMusicArtist(query: string): MusicArtistDefinition | null {
  const value = query.toLowerCase();

  for (const artist of MUSIC_ARTISTS) {
    const terms = [artist.searchTerm, artist.label, artist.ticketmasterKeyword];
    if (terms.some((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(value))) {
      return artist;
    }
  }

  return null;
}

function cleanupArtistCandidate(raw: string): string | null {
  const candidate = normalizeArtistText(raw)
    .replace(/^(?:see|watch)\s+/i, "")
    .replace(/\b(?:concert|concerts|tour|tickets?|live|gigs?|shows?)\b.*$/i, "")
    .trim();

  if (!candidate) return null;

  const words = candidate.split(/\s+/).filter(Boolean);
  while (words.length && GENERIC_ARTIST_STOP_WORDS.has(words[0]!.toLowerCase())) {
    words.shift();
  }
  while (words.length && GENERIC_ARTIST_STOP_WORDS.has(words[words.length - 1]!.toLowerCase())) {
    words.pop();
  }

  const cleaned = words.join(" ").trim();
  if (!cleaned || cleaned.split(/\s+/).length > 5) return null;
  if ([...GENERIC_ARTIST_STOP_WORDS].includes(cleaned.toLowerCase())) return null;

  return cleaned;
}

function extractFreeformMusicArtist(query: string): string | null {
  const value = normalizeArtistText(query);
  if (!value || !MUSIC_ARTIST_CONTEXT_PATTERN.test(value)) return null;
  if (extractMusicGenreFromQuery(value)) return null;

  const patterns = [
    /(?:see|watch)?\s*(.+?)\s+(?:concert|concerts|tour|tickets?|live|gigs?)\b/i,
    /^(.+?)\s+tickets?\b/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const candidate = cleanupArtistCandidate(match?.[1] ?? "");
    if (candidate) return candidate;
  }

  return null;
}

/** Resolve a Ticketmaster keyword for a named artist in a music query. */
export function resolveMusicArtistSearch(query: string): MusicArtistMatch | null {
  const value = query.trim();
  if (!value || !MUSIC_ARTIST_CONTEXT_PATTERN.test(value)) return null;

  const known = resolveKnownMusicArtist(value);
  if (known) {
    return { label: known.label, ticketmasterKeyword: known.ticketmasterKeyword };
  }

  const freeform = extractFreeformMusicArtist(value);
  if (freeform) {
    return { label: freeform, ticketmasterKeyword: freeform };
  }

  return null;
}

export function hasNamedMusicArtistInQuery(query: string): boolean {
  return resolveMusicArtistSearch(query) !== null;
}
