import { KOI_EXAMPLE } from "@/lib/koiExamples";

export type SpotOptionAccent = "default" | "food" | "drinks" | "outdoor";

export type SpotOption = {
  id: string;
  label: string;
  query: string;
  accent: SpotOptionAccent;
};

export const SPOT_OPTIONS: SpotOption[] = [
  {
    id: "bbq",
    label: "BBQ",
    query: "BBQ near me",
    accent: "food"
  },
  {
    id: "pizza",
    label: "Pizza",
    query: "Pizza near me",
    accent: "food"
  },
  {
    id: "coffee",
    label: "Coffee",
    query: "Coffee near me",
    accent: "default"
  },
  {
    id: "brewery",
    label: "Brewery",
    query: "Brewery near me",
    accent: "drinks"
  },
  {
    id: "sports-bar",
    label: "Sports Bar",
    query: KOI_EXAMPLE.spotQuery,
    accent: "drinks"
  },
  {
    id: "shopping",
    label: "Shopping",
    query: "Shopping near me",
    accent: "default"
  },
  {
    id: "italian",
    label: "Italian",
    query: KOI_EXAMPLE.italianQuery,
    accent: "food"
  },
  {
    id: "mexican",
    label: "Mexican",
    query: "Mexican restaurant near me",
    accent: "food"
  }
];

export const SPOT_EXAMPLE_PROMPTS = SPOT_OPTIONS.map((option) => option.query);
