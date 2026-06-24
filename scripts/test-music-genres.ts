import { buildPlaceQuery } from "../app/components/SearchPromptAssist";
import { extractMusicGenreFromQuery, musicGenreById } from "@/lib/musicGenres";
import { isMusicEventQuery } from "@/lib/localEventIntent";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const concertsBase = {
  selectedMode: "local" as const,
  localWhat: "events" as const,
  typeId: "concerts",
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};

assert(buildPlaceQuery(concertsBase) === "Concerts near me", "concerts without genre");

const rockConcerts = { ...concertsBase, genre: "rock" };
assert(buildPlaceQuery(rockConcerts) === "Rock concerts near me", "rock genre in query");

const jazzHalfway = { ...concertsBase, genre: "jazz", where: "halfway" as const };
assert(
  buildPlaceQuery(jazzHalfway) === "Jazz concerts halfway between us",
  "jazz genre with halfway location"
);

const rockGenre = extractMusicGenreFromQuery("Rock concerts near me");
assert(rockGenre?.id === "rock", "extract rock from query");
assert(musicGenreById("rock")?.ticketmasterClassification === "Rock", "ticketmaster rock classification");

const hipHop = extractMusicGenreFromQuery("hip hop concerts this weekend");
assert(hipHop?.id === "hip_hop", "extract hip-hop alias");

const edm = extractMusicGenreFromQuery("edm concerts near me");
assert(edm?.id === "electronic", "extract edm as electronic");

assert(!extractMusicGenreFromQuery("country restaurants near me"), "country food does not match genre");
assert(extractMusicGenreFromQuery("jazz near me")?.id === "jazz", "jazz near me matches genre");
assert(isMusicEventQuery("jazz near me"), "jazz near me is music event");
assert(isMusicEventQuery("rock concerts near me"), "genre concert query counts as music event");

console.log("PASS music genre chips and query extraction");
