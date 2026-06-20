export function extractSimilarMediaTitle(query: string) {
  const patterns = [
    /\b(?:movie|movies|film|films|show|shows|series|tv)\s+like\s+(.+?)(?:\?|$)/i,
    /\bsomething like\s+(.+?)(?:\?|$)/i,
    /\b(?:like|similar to)\s+(.+?)(?:\?|$)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    const title = cleanupSimilarTitle(match?.[1] ?? "");
    if (title.length >= 2) return title;
  }

  return "";
}

function cleanupSimilarTitle(value: string) {
  return value
    .replace(/\b(?:on|for|tonight|today|this weekend|this week|to watch|to stream)\b.*$/i, "")
    .replace(/[?.!,]+$/g, "")
    .trim();
}
