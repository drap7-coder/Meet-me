import type { EventResult, LocalEventProfile } from "@/lib/eventResult";

const SUPPRESSED =
  /\b(?:conference|networking|trade show|tradeshow|webinar|virtual event|virtual only|business expo|summit|seminar)\b/i;

const DATE_NIGHT_BOOST = /\b(?:concert|comedy|theatre|theater|music|arts|festival|wine)\b/i;
const FAMILY_BOOST = /\b(?:family|kids|children|festival|sports|circus|disney|magic)\b/i;

export function rankEventResults(events: EventResult[], profile: LocalEventProfile, now = new Date()): EventResult[] {
  const scored = events
    .map((event) => ({
      event,
      score: scoreEvent(event, profile, now)
    }))
    .filter((entry) => entry.score > -100);

  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.event);
}

function scoreEvent(event: EventResult, profile: LocalEventProfile, now: Date): number {
  let score = 0;
  const haystack = `${event.title} ${event.category} ${event.venue}`.toLowerCase();

  if (SUPPRESSED.test(haystack)) return -200;

  const start = Date.parse(event.startTime);
  if (!Number.isNaN(start)) {
    const hoursUntil = (start - now.getTime()) / (1000 * 60 * 60);
    if (profile === "tonight") {
      if (hoursUntil < 0) score -= 80;
      else if (hoursUntil <= 12) score += 40;
      else score -= 50;
    } else if (hoursUntil < 0) {
      score -= 30;
    } else if (hoursUntil <= 72) {
      score += 12;
    }
  }

  if (event.distance != null) {
    score += Math.max(0, 24 - event.distance);
  }

  switch (profile) {
    case "date_night":
      if (DATE_NIGHT_BOOST.test(haystack)) score += 30;
      break;
    case "family":
      if (FAMILY_BOOST.test(haystack)) score += 30;
      break;
    case "weekend":
      if (DATE_NIGHT_BOOST.test(haystack) || FAMILY_BOOST.test(haystack)) score += 12;
      break;
    default:
      break;
  }

  if (event.ticketUrl) score += 4;
  if (event.imageUrl) score += 2;

  return score;
}
