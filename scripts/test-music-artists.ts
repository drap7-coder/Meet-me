import { buildPlaceQuery } from "../app/components/SearchPromptAssist";
import { resolveMusicArtistSearch, hasNamedMusicArtistInQuery } from "@/lib/musicArtists";
import { isMusicEventQuery, isPureEventQuery } from "@/lib/localEventIntent";

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

const taylor = { ...concertsBase, musicArtistId: "taylor_swift" };
assert(buildPlaceQuery(taylor) === "Taylor Swift concerts near me", "artist chip builds query");

const artist = resolveMusicArtistSearch("Taylor Swift tickets near me");
assert(artist?.ticketmasterKeyword === "Taylor Swift", "extract Taylor Swift from tickets query");

const drake = resolveMusicArtistSearch("Drake concert this weekend");
assert(drake?.ticketmasterKeyword === "Drake", "extract Drake from concert query");

assert(hasNamedMusicArtistInQuery("Billie Eilish live near me"), "live near me counts as artist context");
assert(isMusicEventQuery("Taylor Swift tickets"), "artist tickets are music events");
assert(isPureEventQuery("Taylor Swift tickets"), "artist tickets are pure event queries");
assert(!resolveMusicArtistSearch("country restaurants near me"), "food query does not extract artist");

console.log("PASS music artist chips and query extraction");
