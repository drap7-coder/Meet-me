export type SearchKind = "places" | "watch" | "events";

export type SearchAccent = {
  text: string;
  bg: string;
  bgHover: string;
  border: string;
  borderMuted: string;
  borderSoft: string;
  borderOutline: string;
  bgMuted: string;
  bgSoft: string;
  ring: string;
  ringSoft: string;
  dot: string;
  liveBadge: string;
  btnOutline: string;
  btnPrimary: string;
  link: string;
  hoverBorder: string;
  progress: string;
  panelBorder: string;
  panelSoft: string;
  panelLive: string;
  sidebarBorder: string;
};

export const SEARCH_ACCENT: Record<SearchKind, SearchAccent> = {
  places: {
    text: "text-koi",
    bg: "bg-koi",
    bgHover: "hover:bg-koi-hover",
    border: "border-koi",
    borderMuted: "border-koi/20",
    borderSoft: "border-koi/15",
    borderOutline: "border-koi/25",
    bgMuted: "bg-koi/10",
    bgSoft: "bg-koi/5",
    ring: "focus:ring-koi/25",
    ringSoft: "focus:ring-koi/15",
    dot: "bg-koi",
    liveBadge: "bg-koi/10 text-koi",
    btnOutline: "border-koi text-koi hover:bg-koi/10 focus:ring-koi/15",
    btnPrimary: "bg-koi hover:bg-koi-hover focus:ring-koi/25 text-white",
    link: "text-koi underline decoration-koi/40 underline-offset-2 hover:text-koi-hover",
    hoverBorder: "hover:border-koi hover:text-koi",
    progress: "bg-koi/70",
    panelBorder: "border-koi/15",
    panelSoft: "border-koi/20 bg-koi/5",
    panelLive: "border-koi/25 bg-koi/5",
    sidebarBorder: "border-line"
  },
  watch: {
    text: "text-watch",
    bg: "bg-watch",
    bgHover: "hover:bg-[#0077ED]",
    border: "border-watch",
    borderMuted: "border-watch/20",
    borderSoft: "border-watch/15",
    borderOutline: "border-watch/25",
    bgMuted: "bg-watch/10",
    bgSoft: "bg-watch/5",
    ring: "focus:ring-watch/25",
    ringSoft: "focus:ring-watch/15",
    dot: "bg-watch",
    liveBadge: "bg-watch/10 text-watch",
    btnOutline: "border-watch text-watch hover:bg-watch/10 focus:ring-watch/15",
    btnPrimary: "bg-watch hover:bg-[#0077ED] focus:ring-watch/25 text-white",
    link: "text-watch underline decoration-watch/40 underline-offset-2 hover:text-[#0077ED]",
    hoverBorder: "hover:border-watch hover:text-watch",
    progress: "bg-watch/70",
    panelBorder: "border-watch/15",
    panelSoft: "border-watch/20 bg-watch/5",
    panelLive: "border-watch/25 bg-watch/5",
    sidebarBorder: "border-line"
  },
  events: {
    text: "text-events",
    bg: "bg-events",
    bgHover: "hover:bg-[#CF6A52]",
    border: "border-events",
    borderMuted: "border-events/20",
    borderSoft: "border-events/15",
    borderOutline: "border-events/25",
    bgMuted: "bg-events/10",
    bgSoft: "bg-events/5",
    ring: "focus:ring-events/25",
    ringSoft: "focus:ring-events/15",
    dot: "bg-events",
    liveBadge: "bg-events/10 text-events",
    btnOutline: "border-events text-events hover:bg-events/10 focus:ring-events/15",
    btnPrimary: "bg-events hover:bg-[#CF6A52] focus:ring-events/25 text-white",
    link: "text-events underline decoration-events/40 underline-offset-2 hover:text-[#CF6A52]",
    hoverBorder: "hover:border-events hover:text-events",
    progress: "bg-events/70",
    panelBorder: "border-events/15",
    panelSoft: "border-events/20 bg-events/5",
    panelLive: "border-events/25 bg-events/5",
    sidebarBorder: "border-events/15"
  }
};

export function getSearchAccent(kind: SearchKind | null | undefined): SearchAccent {
  return SEARCH_ACCENT[kind ?? "places"];
}

export function botModeToSearchKind(botMode: "watch" | "events"): SearchKind {
  return botMode === "events" ? "events" : "watch";
}
