import { resolveMusicArtistSearch, hasNamedMusicArtistInQuery } from "@/lib/musicArtists";
import { isMusicEventQuery, isPureEventQuery } from "@/lib/localEventIntent";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Artist chips were removed from the builder, but freeform artist queries are still detected.
const artist = resolveMusicArtistSearch("Taylor Swift tickets near me");
assert(artist?.ticketmasterKeyword === "Taylor Swift", "extract Taylor Swift from tickets query");

const drake = resolveMusicArtistSearch("Drake concert this weekend");
assert(drake?.ticketmasterKeyword === "Drake", "extract Drake from concert query");

assert(hasNamedMusicArtistInQuery("Billie Eilish live near me"), "live near me counts as artist context");
assert(isMusicEventQuery("Taylor Swift tickets"), "artist tickets are music events");
assert(isPureEventQuery("Taylor Swift tickets"), "artist tickets are pure event queries");
assert(!resolveMusicArtistSearch("country restaurants near me"), "food query does not extract artist");

console.log("PASS music artist freeform query extraction");
