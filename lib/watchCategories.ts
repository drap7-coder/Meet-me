export type WatchUiOption = {
  label: string;
  query: string;
};

export type WatchUiGroup = {
  label: string;
  options: WatchUiOption[];
};

export const WATCH_UI_GROUPS: WatchUiGroup[] = [
  {
    label: "Streaming",
    options: [
      { label: "Trending Shows", query: "What should we watch tonight?" },
      { label: "New Releases", query: "What new releases should we watch tonight?" },
      { label: "Netflix", query: "What's trending on Netflix?" },
      { label: "Hulu", query: "What's trending on Hulu?" },
      { label: "Prime Video", query: "What's trending on Prime Video?" },
      { label: "Apple TV+", query: "What's trending on Apple TV+?" }
    ]
  },
  {
    label: "Movies",
    options: [
      { label: "Movies Tonight", query: "What should we watch tonight?" },
      { label: "Movie Theaters", query: "Movie theater near me" },
      { label: "Date Night Movies", query: "Best date night movies tonight" },
      { label: "Family Movies", query: "Best family movies tonight" }
    ]
  },
  {
    label: "Sports",
    options: [
      { label: "Live Sports", query: "What live sports are on tonight?" },
      { label: "Eagles Game", query: "Best place to watch the Eagles game near me" },
      { label: "Phillies Game", query: "Best place to watch the Phillies game near me" },
      { label: "Soccer Matches", query: "Where can I watch soccer matches tonight?" },
      { label: "Sports Bars", query: "Find a sports bar near me" }
    ]
  }
];

export const WATCH_EVENTS_EXAMPLE_PROMPTS = [
  "What should we watch tonight?",
  "What's trending on Netflix?",
  "Find a sports bar between Princeton and Philly",
  "Best place to watch the Eagles game near me",
  "Movie theater between Hoboken and Edison"
];

export const WATCH_EVENTS_PLACEHOLDER = "Ask Koi what to watch, stream, or catch live…";
