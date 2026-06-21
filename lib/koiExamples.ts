/** Shared example locations and queries shown across the UI. */
export const KOI_EXAMPLE = {
  locationA: "Hoboken",
  locationB: "Edison",
  halfwayQuery: "Dinner halfway between Hoboken and Edison",
  breweryHalfwayQuery: "Brewery halfway between Hoboken and Edison",
  lunchHalfwayQuery: "Lunch halfway between Hoboken and Edison",
  spotQuery: "Sports bar near Hoboken",
  italianQuery: "Italian restaurant near Edison",
  streamQuery: "Funny comedy shows on Netflix",
  funnyMoviesQuery: "Funny movies like Superbad",
  sciFiShowsQuery: "Best sci-fi shows to stream",
  trendingMoviesQuery: "Trending movies this week"
} as const;

export function formatHalfwayExample(lookingFor: string) {
  return `${lookingFor} halfway between ${KOI_EXAMPLE.locationA} and ${KOI_EXAMPLE.locationB}`;
}
