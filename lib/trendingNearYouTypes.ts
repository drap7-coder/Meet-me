export type TrendingNearYouCard = {
  id: string;
  kind: "event" | "farmers_market" | "ev";
  title: string;
  subtitle: string;
  badge: string;
  imageUrl?: string;
  actionUrl?: string;
  searchQuery?: string;
};

export type TrendingNearYouPayload = {
  configured: boolean;
  cards: TrendingNearYouCard[];
};
