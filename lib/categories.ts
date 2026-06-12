import type { MeetupMode, VenueCategory } from "@/lib/types";

export type PrimaryCategoryId = "food_drink" | "shopping" | "activities" | "family" | "explore" | "colleges";

type CategorySearchConfig = {
  single: string[];
  district: string[];
};

export type SubcategoryConfig = {
  id: VenueCategory;
  label: string;
  description: string;
  resultBadge: string;
  explanation: string;
  searchTerms: CategorySearchConfig;
};

export type PrimaryCategoryConfig = {
  id: PrimaryCategoryId;
  label: string;
  description: string;
  accent: string;
  subcategories: SubcategoryConfig[];
};

export const DEFAULT_MEETUP_MODE: MeetupMode = "single";

export const FEATURED_CATEGORY_ORDER: VenueCategory[] = [
  "restaurant",
  "coffee",
  "breweries",
  "wine_bars",
  "events",
  "engineering_stem",
  "sports",
  "hotels",
  "park",
  "museums",
  "downtowns"
];

export const CATEGORY_GROUPS: PrimaryCategoryConfig[] = [
  {
    id: "food_drink",
    label: "Food & Drink",
    description: "Coffee, brunch, dinner, dessert, and low-pressure places to sit awhile.",
    accent: "from-[#EEF4FF] to-white",
    subcategories: [
      category("coffee", "Coffee", "Simple, flexible spots for an easy first plan.", "Best Food Match", "A simple low-commitment meet-up spot with balanced travel times.", {
        single: ["coffee shop", "cafe", "espresso bar", "coffee roaster"],
        district: ["walkable cafe district", "coffee shops downtown", "main street cafes", "town center coffee"]
      }),
      category("brunch", "Brunch", "Daytime meals with room to linger.", "Best Food Match", "A balanced brunch option near the midpoint with enough flexibility for both schedules.", {
        single: ["brunch restaurant", "breakfast restaurant", "brunch cafe", "all day cafe"],
        district: ["brunch downtown", "walkable brunch area", "main street brunch", "restaurant district brunch"]
      }),
      category("restaurant", "Restaurants", "A classic sit-down plan for lunch or dinner.", "Best Food Match", "A strong restaurant match near the midpoint, with fair drive times for both people.", {
        single: ["restaurant", "casual restaurant", "highly rated restaurant", "dinner restaurant"],
        district: ["restaurant district", "downtown restaurants", "walkable dining district", "main street restaurants"]
      }),
      category("breweries", "Breweries", "Casual drinks, open seating, and group-friendly energy.", "Best Food Match", "A brewery-focused match near the midpoint with workable travel times for both people.", {
        single: ["brewery", "craft brewery", "brewpub", "beer garden"],
        district: ["brewery district", "downtown breweries", "walkable brewery area", "brewpub district"]
      }),
      category("wine_bars", "Wine Bars", "A polished drinks plan with a calmer pace.", "Best Food Match", "A wine bar match that keeps the trip balanced while feeling a little more elevated.", {
        single: ["wine bar", "wine lounge", "wine tasting room", "wine restaurant"],
        district: ["wine bars downtown", "walkable wine bar district", "downtown tasting rooms", "main street wine bars"]
      }),
      category("dessert", "Dessert", "Short, sweet plans that do not overcomplicate the day.", "Best Food Match", "A dessert-focused spot near the midpoint for an easy, low-commitment meet-up.", {
        single: ["dessert shop", "ice cream shop", "bakery", "gelato shop"],
        district: ["downtown dessert shops", "walkable dessert area", "main street bakery", "town center dessert"]
      })
    ]
  },
  {
    id: "shopping",
    label: "Shopping",
    description: "Malls, outlets, thrift finds, bookstores, markets, and design stops.",
    accent: "from-[#F7F3FF] to-white",
    subcategories: [
      category("malls", "Malls", "Indoor retail clusters with food and easy backup options.", "Best Shopping Match", "A strong shopping mall match near the midpoint, with fair drive times for both people.", {
        single: ["shopping mall", "retail center", "shopping center"],
        district: ["shopping mall", "retail center", "shopping center", "shopping district"]
      }),
      category("outlets", "Outlets", "Outlet centers and brand-heavy shopping trips.", "Best Shopping Match", "A strong outlet match near the midpoint, with fair drive times for both people.", {
        single: ["outlet mall", "premium outlets", "factory outlet", "outlet center"],
        district: ["outlet mall", "premium outlets", "factory outlet", "outlet center"]
      }),
      category("thrifting", "Thrifting", "Second-hand stores, consignment, and treasure-hunt stops.", "Best Shopping Match", "A good thrift-focused area with nearby coffee and walkable stops.", {
        single: ["thrift store", "second hand store", "consignment shop", "vintage clothing"],
        district: ["thrift stores district", "second hand shopping district", "walkable thrift shops", "vintage shopping district"]
      }),
      category("vintage", "Vintage", "Retro fashion, collectible finds, and character-rich shops.", "Best Shopping Match", "A good vintage-focused match with nearby stops worth browsing.", {
        single: ["vintage shop", "vintage clothing", "retro store", "antique vintage"],
        district: ["vintage district", "vintage shopping district", "walkable vintage shops", "historic downtown vintage"]
      }),
      category("antiques", "Antiques", "Antique stores, markets, and slower browsing days.", "Best Shopping Match", "An antiques-focused match near the midpoint with places worth browsing together.", {
        single: ["antique store", "antique shop", "antique mall", "collectibles store"],
        district: ["antique district", "antique mall", "historic downtown antiques", "main street antique shops"]
      }),
      category("bookstore", "Bookstores", "Independent shops, used books, and cozy browsing.", "Best Shopping Match", "A bookstore match that keeps the plan simple, relaxed, and balanced.", {
        single: ["bookstore", "independent bookstore", "used bookstore"],
        district: ["bookstores downtown", "walkable bookstore area", "main street bookstores", "literary district"]
      }),
      category("home_design", "Home & Design", "Furniture, home goods, decor, and design shops.", "Best Shopping Match", "A home and design match with useful browsing nearby and fair travel times.", {
        single: ["home goods store", "furniture store", "interior design store", "home decor store"],
        district: ["design district", "home design district", "furniture district", "walkable design shops"]
      }),
      category("farmers_markets", "Farmers Markets", "Seasonal markets, local food, and easy wandering.", "Best Shopping Match", "A farmers market match near the midpoint with a relaxed, walkable feel.", {
        single: ["farmers market", "public market", "local market", "farm market"],
        district: ["farmers market downtown", "public market district", "walkable market", "main street farmers market"]
      })
    ]
  },
  {
    id: "activities",
    label: "Activities",
    description: "Golf, pickleball, bowling, games, and plans with something to do.",
    accent: "from-[#EEFDF5] to-white",
    subcategories: [
      category("golf", "Golf", "Courses and golf-forward outings.", "Best Activity Match", "A golf-focused match near the midpoint with workable travel times for both people.", {
        single: ["golf course", "public golf course", "golf club", "golf simulator"],
        district: ["golf area", "golf courses near downtown", "public golf course area", "golf destination"]
      }),
      category("events", "Events", "Shows, performances, markets, and calendar-driven plans.", "Best Activity Match", "An event-friendly match near the midpoint with a clear plan attached.", {
        single: ["events", "live events", "things to do", "local events"],
        district: ["event district", "downtown events", "walkable entertainment district", "town center events"]
      }),
      category("sports", "Sports", "Sports venues, athletic centers, courts, fields, and active plans.", "Best Activity Match", "A sports-focused match near the midpoint with workable travel times for both people.", {
        single: ["sports complex", "sports venue", "athletic center", "recreation center"],
        district: ["sports complex area", "sports district", "athletic center area", "recreation district"]
      }),
      category("driving_range", "Driving Range", "Low-pressure swings without a full round.", "Best Activity Match", "A driving range match near the midpoint for an easy activity-focused meet-up.", {
        single: ["driving range", "golf driving range", "topgolf", "golf range"],
        district: ["driving range area", "golf range district", "golf entertainment center", "activity center golf"]
      }),
      category("pickleball", "Pickleball", "Courts and active plans with a social feel.", "Best Activity Match", "A pickleball-focused match with fair drive times and an easy activity built in.", {
        single: ["pickleball court", "pickleball club", "indoor pickleball", "public pickleball courts"],
        district: ["pickleball courts area", "sports complex pickleball", "recreation center pickleball", "activity district pickleball"]
      }),
      category("bowling", "Bowling", "Classic indoor activity with food and flexible timing.", "Best Activity Match", "A bowling match near the midpoint that gives the plan an easy built-in activity.", {
        single: ["bowling alley", "bowling lounge", "bowling center", "duckpin bowling"],
        district: ["bowling entertainment district", "downtown bowling", "activity district bowling", "entertainment center bowling"]
      }),
      category("escape_rooms", "Escape Rooms", "Structured group plans with a clear start and finish.", "Best Activity Match", "An escape room match near the midpoint for a more intentional activity plan.", {
        single: ["escape room", "escape game", "escape room center", "adventure escape room"],
        district: ["escape rooms downtown", "entertainment district escape rooms", "activity district escape rooms", "walkable escape rooms"]
      }),
      category("arcades", "Arcades", "Games, drinks, and playful indoor energy.", "Best Activity Match", "An arcade match that keeps the drive practical while giving you something fun to do.", {
        single: ["arcade", "bar arcade", "family arcade", "game center"],
        district: ["arcade district", "entertainment district arcade", "downtown arcade", "game center district"]
      })
    ]
  },
  {
    id: "family",
    label: "Family",
    description: "Parks, zoos, museums, playgrounds, and easy all-ages options.",
    accent: "from-[#FFF7ED] to-white",
    subcategories: [
      category("park", "Parks", "Open-air space with room to walk and reset.", "Best Overall Match", "A park match near the midpoint with room to walk, sit, and keep the plan flexible.", {
        single: ["park", "public park", "garden", "nature park"],
        district: ["walkable park district", "downtown park", "waterfront park area", "parks near main street"]
      }),
      category("zoos", "Zoos", "Destination outings with a clear activity arc.", "Best Overall Match", "A zoo-focused match near the midpoint for a bigger family-friendly outing.", {
        single: ["zoo", "wildlife park", "animal park", "safari park"],
        district: ["zoo district", "wildlife park area", "family attraction district", "zoo nearby downtown"]
      }),
      category("aquariums", "Aquariums", "Indoor destination plans for a memorable meet-up.", "Best Overall Match", "An aquarium match with balanced travel times and a clear shared activity.", {
        single: ["aquarium", "sea life aquarium", "marine center", "aquatic museum"],
        district: ["aquarium district", "waterfront aquarium area", "family attraction district aquarium", "downtown aquarium"]
      }),
      category("childrens_museums", "Children's Museums", "Hands-on indoor stops for family plans.", "Best Overall Match", "A children's museum match near the midpoint with an easy activity for the day.", {
        single: ["children's museum", "kids museum", "hands on museum", "family museum"],
        district: ["children's museum district", "family museum district", "downtown children's museum", "family attraction district"]
      }),
      category("museums", "Museums", "Museums, exhibits, galleries, and culture-forward meet-ups.", "Best Overall Match", "A museum match near the midpoint with a clear activity and fair drive times.", {
        single: ["museum", "art museum", "history museum", "gallery"],
        district: ["museum district", "downtown museums", "arts district", "walkable museum area"]
      }),
      category("playgrounds", "Playgrounds", "Simple outdoor meet-ups with low planning overhead.", "Best Overall Match", "A playground match near the midpoint for an easy, flexible family meet-up.", {
        single: ["playground", "public playground", "inclusive playground", "kids playground"],
        district: ["playgrounds near downtown", "park with playground", "walkable playground area", "family park district"]
      })
    ]
  },
  {
    id: "explore",
    label: "Explore",
    description: "Downtowns, main streets, waterfronts, small towns, and scenic stops.",
    accent: "from-[#F1F5F9] to-white",
    subcategories: [
      category("downtowns", "Downtowns", "A whole area to wander, eat, shop, and explore.", "Best District", "A walkable downtown near the midpoint with multiple places to eat, shop, and explore.", {
        single: ["downtown", "town center", "main street", "city center"],
        district: ["downtown", "walkable downtown", "main street", "town center"]
      }),
      category("walkable_main_streets", "Walkable Main Streets", "Compact streets with shops, food, and a sense of place.", "Best District", "A walkable main street near the midpoint with easy stops before or after the main plan.", {
        single: ["main street", "historic main street", "walkable shops", "town center"],
        district: ["main street", "walkable shopping district", "historic downtown"]
      }),
      category("waterfronts", "Waterfronts", "Water views, walks, restaurants, and destination energy.", "Best District", "A waterfront match near the midpoint with places to walk, eat, and linger.", {
        single: ["waterfront", "waterfront restaurant", "riverwalk", "marina"],
        district: ["waterfront district", "riverwalk district", "walkable waterfront", "downtown waterfront"]
      }),
      category("small_towns", "Small Towns", "A charming midpoint with a few easy stops.", "Best District", "A small-town match near the midpoint with a compact area to eat, shop, and explore.", {
        single: ["small town downtown", "historic town center", "main street", "town square"],
        district: ["small town downtown", "historic downtown", "walkable small town", "main street town center"]
      }),
      category("scenic_spots", "Scenic Spots", "Views, overlooks, gardens, and memorable places to pause.", "Best Overall Match", "A scenic match near the midpoint with a more memorable setting for the meet-up.", {
        single: ["scenic overlook", "scenic spot", "viewpoint", "botanical garden"],
        district: ["scenic downtown", "waterfront scenic area", "walkable scenic area", "scenic main street"]
      }),
      category("hotels", "Hotels", "Hotel lobbies, lounges, and overnight-friendly meeting points.", "Best Overall Match", "A hotel match near the midpoint that can work for longer trips or overnight plans.", {
        single: ["hotel", "boutique hotel", "hotel lounge", "inn"],
        district: ["hotel district", "downtown hotels", "hotel area", "town center hotels"]
      })
    ]
  },
  {
    id: "colleges",
    label: "Colleges",
    description: "Find schools by fit — STEM, business, health, liberal arts, urban campuses, and classic college towns.",
    accent: "from-[#EEF4FF] to-white",
    subcategories: [
      category("engineering_stem", "Engineering & STEM", "Engineering, computer science, technology, and science-forward schools.", "Best Overall Match", "A strong STEM-focused college match near the midpoint with fair travel times.", {
        single: ["engineering schools", "STEM colleges", "computer science colleges", "technology universities", "science programs"],
        district: ["engineering schools", "STEM colleges", "computer science colleges", "technology universities", "science programs"]
      }),
      category("business_finance", "Business & Finance", "Business, finance, economics, and undergraduate business programs.", "Best Overall Match", "A strong business-focused college match near the midpoint with fair travel times.", {
        single: ["business schools", "finance programs", "economics colleges", "undergraduate business programs"],
        district: ["business schools", "finance programs", "economics colleges", "undergraduate business programs"]
      }),
      category("health_pre_med", "Health & Pre-Med", "Pre-med, health sciences, nursing, and biology-focused programs.", "Best Overall Match", "A health and pre-med college match near the midpoint with fair travel times.", {
        single: ["pre-med colleges", "health sciences programs", "nursing schools", "biology programs"],
        district: ["pre-med colleges", "health sciences programs", "nursing schools", "biology programs"]
      }),
      category("liberal_arts", "Liberal Arts", "Small colleges, humanities programs, and undergraduate liberal arts schools.", "Best Overall Match", "A liberal arts college match near the midpoint with a thoughtful campus fit.", {
        single: ["liberal arts colleges", "small colleges", "humanities colleges", "undergraduate liberal arts"],
        district: ["liberal arts colleges", "small colleges", "humanities colleges", "undergraduate liberal arts"]
      }),
      category("urban_campuses", "Urban Campuses", "City campuses, downtown schools, and universities in urban settings.", "Best Overall Match", "An urban campus match near the midpoint with city access and fair drive times.", {
        single: ["urban colleges", "city campuses", "universities in cities", "downtown campus"],
        district: ["urban colleges", "city campuses", "universities in cities", "downtown campus"]
      }),
      category("college_towns", "College Towns", "Traditional campuses, residential colleges, and classic student towns.", "Best District", "A classic college-town match near the midpoint with a strong campus feel.", {
        single: ["college towns", "traditional campus", "residential colleges", "student town"],
        district: ["college towns", "traditional campus", "residential colleges", "student town"]
      })
    ]
  }
];

const LEGACY_CATEGORIES: SubcategoryConfig[] = [
  category("shopping", "Shopping", "Legacy shopping category.", "Best Shopping Match", "A shopping match near the midpoint with places worth browsing together.", {
    single: ["shopping mall", "shopping center", "retail center", "stores"],
    district: ["shopping district", "walkable shopping district", "main street shops", "retail district"]
  }),
  category("activities", "Activities", "Legacy activities category.", "Best Activity Match", "An activity-focused match near the midpoint with a built-in thing to do.", {
    single: ["things to do", "activity center", "entertainment center", "recreation center"],
    district: ["entertainment district", "activity district", "downtown activities", "walkable entertainment area"]
  }),
  category("family", "Family", "Legacy family category.", "Best Overall Match", "A family-friendly match near the midpoint with an easy shared activity.", {
    single: ["family friendly activity", "family attraction", "kids activity", "family fun"],
    district: ["family attraction district", "family friendly downtown", "family activity area", "walkable family attractions"]
  }),
  category("universities", "Universities", "Legacy universities category.", "Best Overall Match", "A university-area match near the midpoint with a recognizable campus or college nearby.", {
    single: ["university", "college", "campus"],
    district: ["university district", "college town", "campus area", "college campus"]
  }),
  category("bar", "Drinks", "Legacy drinks category.", "Best Food Match", "A strong drinks-focused option near the midpoint with workable travel times.", {
    single: ["bar", "cocktail bar", "pub", "drinks"],
    district: ["bar district", "downtown bars", "walkable drinks district", "main street bars"]
  })
];

export const CATEGORIES = [...CATEGORY_GROUPS.flatMap((group) => group.subcategories), ...LEGACY_CATEGORIES];

export const FEATURED_CATEGORIES = FEATURED_CATEGORY_ORDER.map((categoryId) => getCategoryConfig(categoryId)).filter(
  (category): category is SubcategoryConfig => Boolean(category)
);

export function getCategoryLabel(category: VenueCategory) {
  return getCategoryConfig(normalizeCategory(category))?.label ?? "Custom";
}

export function getCategoryConfig(category: VenueCategory) {
  return CATEGORIES.find((item) => item.id === normalizeCategory(category)) ?? null;
}

export function getPrimaryCategory(category: VenueCategory) {
  category = normalizeCategory(category);
  if (category === "bar") return CATEGORY_GROUPS[0];
  if (category === "shopping") return CATEGORY_GROUPS.find((group) => group.id === "shopping") ?? CATEGORY_GROUPS[0];
  if (category === "activities") return CATEGORY_GROUPS.find((group) => group.id === "activities") ?? CATEGORY_GROUPS[0];
  if (category === "family") return CATEGORY_GROUPS.find((group) => group.id === "family") ?? CATEGORY_GROUPS[0];
  if (category === "universities") return CATEGORY_GROUPS.find((group) => group.id === "colleges") ?? CATEGORY_GROUPS[0];
  return CATEGORY_GROUPS.find((group) => group.subcategories.some((item) => item.id === category)) ?? CATEGORY_GROUPS[0];
}

export function getPrimaryCategoryId(category: VenueCategory) {
  return getPrimaryCategory(category).id;
}

export function getDefaultCategoryForPrimary(primaryId: PrimaryCategoryId): VenueCategory {
  return CATEGORY_GROUPS.find((group) => group.id === primaryId)?.subcategories[0]?.id ?? "coffee";
}

export function normalizeCategory(category: VenueCategory): VenueCategory {
  if (category === "colleges" || category === "universities") return "engineering_stem";
  return category;
}

export function parseMeetupMode(value: string | null | undefined): MeetupMode {
  return value === "district" ? "district" : DEFAULT_MEETUP_MODE;
}

export function getCategorySearchTerms(
  category: VenueCategory,
  customQuery?: string,
  meetupMode: MeetupMode = DEFAULT_MEETUP_MODE
) {
  category = normalizeCategory(category);
  if (category === "custom") return [customQuery?.trim() || "places to meet"];
  const config = getCategoryConfig(category);
  if (!config) return ["places to meet"];
  return config.searchTerms[meetupMode].length ? config.searchTerms[meetupMode] : config.searchTerms.single;
}

export function getCategorySearchTerm(
  category: VenueCategory,
  customQuery?: string,
  meetupMode: MeetupMode = DEFAULT_MEETUP_MODE
) {
  return getCategorySearchTerms(category, customQuery, meetupMode)[0] ?? "places to meet";
}

function category(
  id: VenueCategory,
  label: string,
  description: string,
  resultBadge: string,
  explanation: string,
  searchTerms: CategorySearchConfig
): SubcategoryConfig {
  return {
    id,
    label,
    description,
    resultBadge,
    explanation,
    searchTerms
  };
}
