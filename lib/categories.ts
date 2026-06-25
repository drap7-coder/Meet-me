import { isCurrentLocationReference, looksLikeCurrentLocationQuery } from "@/lib/currentLocation";
import { isEvChargingIntent, stripEvChargingPhrases } from "@/lib/evSearchIntent";
import { parseNearFeatureQuery } from "@/lib/nearFeatureQuery";
import type { MeetupMode, SearchMode, VenueCategory } from "@/lib/types";

export type PrimaryCategoryId = "food" | "drinks" | "shopping" | "activities" | "family" | "explore" | "colleges" | "outdoors";

type CategorySearchConfig = {
  single: string[];
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
export const DEFAULT_SEARCH_MODE: SearchMode = "midpoint";

export const FEATURED_CATEGORY_ORDER: VenueCategory[] = [
  "restaurant",
  "coffee",
  "italian",
  "breweries",
  "wine_bars",
  "cocktail_bars",
  "events",
  "engineering_stem",
  "sports",
  "hotels",
  "park",
  "hiking",
  "museums",
  "downtowns"
];

export const CATEGORY_GROUPS: PrimaryCategoryConfig[] = [
  {
    id: "food",
    label: "Food",
    description: "Dining & cuisines",
    accent: "from-[#FFF3E8] to-white",
    subcategories: [
      category("italian", "Italian", "Pasta, pizza, trattorias, and neighborhood Italian restaurants.", "Best Food Match", "An Italian food match near the midpoint with fair travel times.", {
        single: ["Italian restaurant", "trattoria", "pasta restaurant", "Italian food"],
      }),
      category("bbq", "BBQ", "Barbecue, smokehouses, ribs, brisket, and casual comfort food.", "Best Food Match", "A BBQ match near the midpoint with balanced travel times.", {
        single: ["bbq restaurant", "barbecue restaurant", "smokehouse", "brisket restaurant"],
      }),
      category("mexican", "Mexican", "Tacos, taquerias, cantinas, and Mexican restaurants.", "Best Food Match", "A Mexican food match near the midpoint with fair travel times.", {
        single: ["Mexican restaurant", "taqueria", "taco restaurant", "cantina"],
      }),
      category("sushi", "Sushi", "Sushi bars, Japanese restaurants, and omakase-style spots.", "Best Food Match", "A sushi match near the midpoint with balanced travel times.", {
        single: ["sushi restaurant", "sushi bar", "Japanese restaurant", "omakase"],
      }),
      category("indian", "Indian", "Indian restaurants, curries, tandoori, and regional cuisine.", "Best Food Match", "An Indian food match near the midpoint with fair travel times.", {
        single: ["Indian restaurant", "curry restaurant", "tandoori restaurant", "Indian food"],
      }),
      category("mediterranean", "Mediterranean", "Mediterranean, Greek, Lebanese, and fresh casual dining.", "Best Food Match", "A Mediterranean food match near the midpoint with balanced travel times.", {
        single: ["Mediterranean restaurant", "Greek restaurant", "Lebanese restaurant", "falafel restaurant"],
      }),
      category("thai", "Thai", "Thai restaurants, noodles, curries, and casual dinner spots.", "Best Food Match", "A Thai food match near the midpoint with fair travel times.", {
        single: ["Thai restaurant", "pad thai restaurant", "Thai food", "Thai curry restaurant"],
      }),
      category("pizza", "Pizza", "Pizzerias, slices, wood-fired pies, and casual meetups.", "Best Food Match", "A pizza match near the midpoint with balanced travel times.", {
        single: ["pizza restaurant", "pizzeria", "wood fired pizza", "pizza shop"],
      }),
      category("seafood", "Seafood", "Seafood restaurants, oyster bars, fish houses, and coastal fare.", "Best Food Match", "A seafood match near the midpoint with fair travel times.", {
        single: ["seafood restaurant", "oyster bar", "fish restaurant", "seafood grill"],
      }),
      category("steakhouse", "Steakhouse", "Steakhouses, grills, and more polished dinner plans.", "Best Food Match", "A steakhouse match near the midpoint with balanced travel times.", {
        single: ["steakhouse", "steak restaurant", "grill steakhouse", "chophouse"],
      }),
      category("breakfast", "Breakfast", "Breakfast, brunch, diners, and daytime places to linger.", "Best Food Match", "A breakfast match near the midpoint with enough flexibility for both schedules.", {
        single: ["brunch restaurant", "breakfast restaurant", "brunch cafe", "all day cafe"],
      }),
      category("coffee", "Coffee Shops", "Simple, flexible spots for an easy first plan.", "Best Food Match", "A simple low-commitment meet-up spot with balanced travel times.", {
        single: ["coffee shop", "cafe", "espresso bar", "coffee roaster"],
      })
    ]
  },
  {
    id: "drinks",
    label: "Drinks",
    description: "Breweries, wine bars & more",
    accent: "from-[#FFF3E8] to-white",
    subcategories: [
      category("breweries", "Breweries", "Casual drinks, open seating, and group-friendly energy.", "Best Food Match", "A brewery-focused match near the midpoint with workable travel times for both people.", {
        single: ["brewery", "craft brewery", "brewpub", "beer garden"],
      }),
      category("wine_bars", "Wine Bars", "A polished drinks plan with a calmer pace.", "Best Food Match", "A wine bar match that keeps the trip balanced while feeling a little more elevated.", {
        single: ["wine bar", "wine lounge", "wine tasting room", "wine restaurant"],
      }),
      category("cocktail_bars", "Cocktail Bars", "Cocktails, date-night bars, and elevated drink spots.", "Best Drinks Match", "A cocktail bar match near the midpoint with fair travel times.", {
        single: ["cocktail bar", "craft cocktail bar", "speakeasy", "cocktail lounge"],
      }),
      category("lounges", "Lounges", "Lounge seating, calmer drinks, and conversation-friendly spots.", "Best Drinks Match", "A lounge match near the midpoint with a comfortable pace.", {
        single: ["lounge", "bar lounge", "cocktail lounge", "hotel lounge"],
      }),
      category("pubs", "Pubs", "Pubs, taverns, and casual places for a relaxed drink.", "Best Drinks Match", "A pub match near the midpoint with balanced travel times.", {
        single: ["pub", "tavern", "gastropub", "neighborhood pub"],
      }),
      category("rooftop_bars", "Rooftop Bars", "Views, skyline energy, and more memorable drink plans.", "Best Drinks Match", "A rooftop bar match near the midpoint with a stronger sense of occasion.", {
        single: ["rooftop bar", "rooftop lounge", "skyline bar", "roof bar"],
      }),
      category("distilleries", "Distilleries", "Distilleries, tasting rooms, and spirit-focused outings.", "Best Drinks Match", "A distillery match near the midpoint with fair travel times.", {
        single: ["distillery", "craft distillery", "spirits tasting room", "whiskey distillery"],
      }),
      category("sports_bars", "Sports Bars", "Games, TVs, casual food, and high-energy meetups.", "Best Drinks Match", "A sports bar match near the midpoint with a built-in game-day plan.", {
        single: ["sports bar", "bar with TVs", "game day bar", "sports pub"],
      }),
      category("cigar_lounges", "Cigar Lounges", "Cigar lounges and slower, more intentional drink plans.", "Best Drinks Match", "A cigar lounge match near the midpoint with a relaxed pace.", {
        single: ["cigar lounge", "cigar bar", "cigar shop lounge", "smoking lounge"],
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
      }),
      category("outlets", "Outlets", "Outlet centers and brand-heavy shopping trips.", "Best Shopping Match", "A strong outlet match near the midpoint, with fair drive times for both people.", {
        single: ["outlet mall", "premium outlets", "factory outlet", "outlet center"],
      }),
      category("thrifting", "Thrifting", "Second-hand stores, consignment, and treasure-hunt stops.", "Best Shopping Match", "A good thrift-focused area with nearby coffee and walkable stops.", {
        single: ["thrift store", "second hand store", "consignment shop", "vintage clothing"],
      }),
      category("vintage", "Vintage", "Retro fashion, collectible finds, and character-rich shops.", "Best Shopping Match", "A good vintage-focused match with nearby stops worth browsing.", {
        single: ["vintage shop", "vintage clothing", "retro store", "antique vintage"],
      }),
      category("antiques", "Antiques", "Antique stores, markets, and slower browsing days.", "Best Shopping Match", "An antiques-focused match near the midpoint with places worth browsing together.", {
        single: ["antique store", "antique shop", "antique mall", "collectibles store"],
      }),
      category("bookstore", "Bookstores", "Independent shops, used books, and cozy browsing.", "Best Shopping Match", "A bookstore match that keeps the plan simple, relaxed, and balanced.", {
        single: ["bookstore", "independent bookstore", "used bookstore"],
      }),
      category("home_design", "Home & Design", "Furniture, home goods, decor, and design shops.", "Best Shopping Match", "A home and design match with useful browsing nearby and fair travel times.", {
        single: ["home goods store", "furniture store", "interior design store", "home decor store"],
      }),
      category("farmers_markets", "Farmers Markets", "Seasonal markets, local food, and easy wandering.", "Best Shopping Match", "A farmers market match near the midpoint with a relaxed, walkable feel.", {
        single: ["farmers market", "public market", "local market", "farm market"],
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
      }),
      category("events", "Events", "Shows, performances, markets, and calendar-driven plans.", "Best Activity Match", "An event-friendly match near the midpoint with a clear plan attached.", {
        single: ["events", "live events", "things to do", "local events"],
      }),
      category("sports", "Sports", "Sports venues, athletic centers, courts, fields, and active plans.", "Best Activity Match", "A sports-focused match near the midpoint with workable travel times for both people.", {
        single: ["sports complex", "sports venue", "athletic center", "recreation center"],
      }),
      category("driving_range", "Driving Range", "Low-pressure swings without a full round.", "Best Activity Match", "A driving range match near the midpoint for an easy activity-focused meet-up.", {
        single: ["driving range", "golf driving range", "topgolf", "golf range"],
      }),
      category("pickleball", "Pickleball", "Courts and active plans with a social feel.", "Best Activity Match", "A pickleball-focused match with fair drive times and an easy activity built in.", {
        single: ["pickleball court", "pickleball club", "indoor pickleball", "public pickleball courts"],
      }),
      category("bowling", "Bowling", "Classic indoor activity with food and flexible timing.", "Best Activity Match", "A bowling match near the midpoint that gives the plan an easy built-in activity.", {
        single: ["bowling alley", "bowling lounge", "bowling center", "duckpin bowling"],
      }),
      category("escape_rooms", "Escape Rooms", "Structured group plans with a clear start and finish.", "Best Activity Match", "An escape room match near the midpoint for a more intentional activity plan.", {
        single: ["escape room", "escape game", "escape room center", "adventure escape room"],
      }),
      category("arcades", "Arcades", "Games, drinks, and playful indoor energy.", "Best Activity Match", "An arcade match that keeps the drive practical while giving you something fun to do.", {
        single: ["arcade", "bar arcade", "family arcade", "game center"],
      })
    ]
  },
  {
    id: "family",
    label: "Family",
    description: "Zoos, museums, aquariums, and easy all-ages options.",
    accent: "from-[#FFF7ED] to-white",
    subcategories: [
      category("zoos", "Zoos", "Destination outings with a clear activity arc.", "Best Overall Match", "A zoo-focused match near the midpoint for a bigger family-friendly outing.", {
        single: ["zoo", "wildlife park", "animal park", "safari park"],
      }),
      category("aquariums", "Aquariums", "Indoor destination plans for a memorable meet-up.", "Best Overall Match", "An aquarium match with balanced travel times and a clear shared activity.", {
        single: ["aquarium", "sea life aquarium", "marine center", "aquatic museum"],
      }),
      category("childrens_museums", "Children's Museums", "Hands-on indoor stops for family plans.", "Best Overall Match", "A children's museum match near the midpoint with an easy activity for the day.", {
        single: ["children's museum", "kids museum", "hands on museum", "family museum"],
      }),
      category("museums", "Museums", "Museums, exhibits, galleries, and culture-forward meet-ups.", "Best Overall Match", "A museum match near the midpoint with a clear activity and fair drive times.", {
        single: ["museum", "art museum", "history museum", "gallery"],
      })
    ]
  },
  {
    id: "explore",
    label: "Explore",
    description: "Downtowns, main streets, small towns, and flexible destination areas.",
    accent: "from-[#F1F5F9] to-white",
    subcategories: [
      category("downtowns", "Downtowns", "A whole area to wander, eat, shop, and explore.", "Best District", "A walkable downtown near the midpoint with multiple places to eat, shop, and explore.", {
        single: ["downtown", "town center", "main street", "city center"],
      }),
      category("walkable_main_streets", "Walkable Main Streets", "Compact streets with shops, food, and a sense of place.", "Best District", "A walkable main street near the midpoint with easy stops before or after the main plan.", {
        single: ["main street", "historic main street", "walkable shops", "town center"],
      }),
      category("small_towns", "Small Towns", "A charming midpoint with a few easy stops.", "Best District", "A small-town match near the midpoint with a compact area to eat, shop, and explore.", {
        single: ["small town downtown", "historic town center", "main street", "town square"],
      }),
      category("hotels", "Hotels", "Hotel lobbies, lounges, and overnight-friendly meeting points.", "Best Overall Match", "A hotel match near the midpoint that can work for longer trips or overnight plans.", {
        single: ["hotel", "boutique hotel", "hotel lounge", "inn"],
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
      }),
      category("business_finance", "Business & Finance", "Business, finance, economics, and undergraduate business programs.", "Best Overall Match", "A strong business-focused college match near the midpoint with fair travel times.", {
        single: ["business schools", "finance programs", "economics colleges", "undergraduate business programs"],
      }),
      category("health_pre_med", "Health & Pre-Med", "Pre-med, health sciences, nursing, and biology-focused programs.", "Best Overall Match", "A health and pre-med college match near the midpoint with fair travel times.", {
        single: ["pre-med colleges", "health sciences programs", "nursing schools", "biology programs"],
      }),
      category("liberal_arts", "Liberal Arts", "Small colleges, humanities programs, and undergraduate liberal arts schools.", "Best Overall Match", "A liberal arts college match near the midpoint with a thoughtful campus fit.", {
        single: ["liberal arts colleges", "small colleges", "humanities colleges", "undergraduate liberal arts"],
      }),
      category("urban_campuses", "Urban Campuses", "City campuses, downtown schools, and universities in urban settings.", "Best Overall Match", "An urban campus match near the midpoint with city access and fair drive times.", {
        single: ["urban colleges", "city campuses", "universities in cities", "downtown campus"],
      }),
      category("college_towns", "College Towns", "Traditional campuses, residential colleges, and classic student towns.", "Best District", "A classic college-town match near the midpoint with a strong campus feel.", {
        single: ["college towns", "traditional campus", "residential colleges", "student town"],
      })
    ]
  },
  {
    id: "outdoors",
    label: "Outdoors",
    description: "Parks, trails & fresh air",
    accent: "from-[#F2EFE7] to-white",
    subcategories: [
      category("park", "Parks", "Open-air space with room to walk and reset.", "Best Outdoors Match", "A park match near the midpoint with room to walk, sit, and keep the plan flexible.", {
        single: ["park", "public park", "garden", "nature park"],
      }),
      category("hiking", "Hiking", "Hiking areas, nature paths, and outdoor activity plans.", "Best Outdoors Match", "A hiking match near the midpoint with a clear outdoor plan.", {
        single: ["hiking area", "hiking trail", "trailhead", "nature trail"],
      }),
      category("trails", "Trails", "Walking, biking, and multi-use trails.", "Best Outdoors Match", "A trail match near the midpoint for an easy outdoor meetup.", {
        single: ["walking trail", "bike trail", "multi-use trail", "rail trail"],
      }),
      category("gardens", "Gardens", "Botanical gardens, public gardens, and peaceful green spaces.", "Best Outdoors Match", "A garden match near the midpoint with a calmer outdoor setting.", {
        single: ["botanical garden", "public garden", "arboretum", "garden"],
      }),
      category("waterfronts", "Waterfronts", "Water views, walks, restaurants, and destination energy.", "Best Outdoors Match", "A waterfront match near the midpoint with places to walk, eat, and linger.", {
        single: ["waterfront", "waterfront park", "riverwalk", "marina"],
      }),
      category("scenic_walks", "Scenic Walks", "Memorable walks, overlooks, and low-pressure outdoor plans.", "Best Outdoors Match", "A scenic walk match near the midpoint with a more memorable setting.", {
        single: ["scenic walk", "scenic overlook", "viewpoint", "walking path"],
      }),
      category("dog_parks", "Dog Parks", "Dog-friendly parks and easy outdoor meetups.", "Best Outdoors Match", "A dog park match near the midpoint with an easy outdoor plan.", {
        single: ["dog park", "off leash dog park", "dog friendly park", "pet friendly park"],
      }),
      category("playgrounds", "Playgrounds", "Simple outdoor meet-ups with low planning overhead.", "Best Outdoors Match", "A playground match near the midpoint for an easy, flexible meet-up.", {
        single: ["playground", "public playground", "inclusive playground", "kids playground"],
      }),
      category("nature_preserves", "Nature Preserves", "Protected natural areas, quiet trails, and fresh air.", "Best Outdoors Match", "A nature preserve match near the midpoint for a quieter outdoor plan.", {
        single: ["nature preserve", "wildlife preserve", "conservation area", "nature reserve"],
      }),
      category("picnic_areas", "Picnic Areas", "Picnic spots, shelters, and relaxed outdoor gathering places.", "Best Outdoors Match", "A picnic area match near the midpoint for a relaxed outdoor plan.", {
        single: ["picnic area", "picnic shelter", "park picnic area", "picnic tables"],
      })
    ]
  }
];

const LEGACY_CATEGORIES: SubcategoryConfig[] = [
  category("restaurant", "Restaurants", "A classic sit-down plan for lunch or dinner.", "Best Food Match", "A strong restaurant match near the midpoint, with fair drive times for both people.", {
    single: ["restaurant", "casual restaurant", "highly rated restaurant", "dinner restaurant"],
  }),
  category("brunch", "Brunch", "Daytime meals with room to linger.", "Best Food Match", "A balanced brunch option near the midpoint with enough flexibility for both schedules.", {
    single: ["brunch restaurant", "breakfast restaurant", "brunch cafe", "all day cafe"],
  }),
  category("dessert", "Dessert", "Short, sweet plans that do not overcomplicate the day.", "Best Food Match", "A dessert-focused spot near the midpoint for an easy, low-commitment meet-up.", {
    single: ["dessert shop", "ice cream shop", "bakery", "gelato shop"],
  }),
  category("shopping", "Shopping", "Legacy shopping category.", "Best Shopping Match", "A shopping match near the midpoint with places worth browsing together.", {
    single: ["shopping mall", "shopping center", "retail center", "stores"],
  }),
  category("activities", "Activities", "Legacy activities category.", "Best Activity Match", "An activity-focused match near the midpoint with a built-in thing to do.", {
    single: ["things to do", "activity center", "entertainment center", "recreation center"],
  }),
  category("family", "Family", "Legacy family category.", "Best Overall Match", "A family-friendly match near the midpoint with an easy shared activity.", {
    single: ["family friendly activity", "family attraction", "kids activity", "family fun"],
  }),
  category("universities", "Universities", "Legacy universities category.", "Best Overall Match", "A university-area match near the midpoint with a recognizable campus or college nearby.", {
    single: ["university", "college", "campus"],
  }),
  category("bar", "Drinks", "Legacy drinks category.", "Best Food Match", "A strong drinks-focused option near the midpoint with workable travel times.", {
    single: ["bar", "cocktail bar", "pub", "drinks"],
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
  if (category === "bar") return CATEGORY_GROUPS.find((group) => group.id === "drinks") ?? CATEGORY_GROUPS[0];
  if (category === "restaurant" || category === "brunch" || category === "dessert") return CATEGORY_GROUPS.find((group) => group.id === "food") ?? CATEGORY_GROUPS[0];
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
  if (String(category) === "food_drink") return "coffee";
  if (String(category) === "real_estate" || String(category).startsWith("real_estate_")) return "downtowns";
  return category;
}

export function mapCategoryIntent(input: string | null | undefined): { category: VenueCategory; customQuery?: string } {
  const raw = input?.trim();
  if (!raw) return { category: "coffee" };

  const normalized = raw.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  const compact = normalized.replace(/\s+/g, "_");
  const exact = CATEGORIES.find((item) => item.id === compact || item.label.toLowerCase() === normalized);
  if (exact) return { category: normalizeCategory(exact.id) };

  const aliases: Record<string, VenueCategory> = {
    cafe: "coffee",
    cafes: "coffee",
    coffee_shop: "coffee",
    coffee_shops: "coffee",
    dinner: "restaurant",
    lunch: "restaurant",
    food: "restaurant",
    cuisine: "restaurant",
    dining: "restaurant",
    restaurants: "restaurant",
    restaurant: "restaurant",
    eat: "restaurant",
    eating: "restaurant",
    meals: "restaurant",
    meal: "restaurant",
    italian_food: "italian",
    barbecue: "bbq",
    barbeque: "bbq",
    mexican_food: "mexican",
    tacos: "mexican",
    taco: "mexican",
    japanese: "sushi",
    sushi_bar: "sushi",
    asian_food: "asian",
    american_food: "american",
    indian_food: "indian",
    mediterranean_food: "mediterranean",
    greek: "mediterranean",
    thai_food: "thai",
    pizzeria: "pizza",
    pizza_place: "pizza",
    seafood_restaurant: "seafood",
    steak: "steakhouse",
    steak_house: "steakhouse",
    breakfast: "breakfast",
    vegan_food: "vegan",
    vegetarian: "vegan",
    drinks: "cocktail_bars",
    cocktails: "cocktail_bars",
    cocktail: "cocktail_bars",
    cocktail_bar: "cocktail_bars",
    bar: "cocktail_bars",
    bars: "cocktail_bars",
    pub: "pubs",
    pubs: "pubs",
    tavern: "pubs",
    beer: "breweries",
    brewery: "breweries",
    breweries: "breweries",
    brewpub: "breweries",
    brewpubs: "breweries",
    wine: "wine_bars",
    wine_bar: "wine_bars",
    lounge: "lounges",
    lounges: "lounges",
    rooftop: "rooftop_bars",
    rooftop_bar: "rooftop_bars",
    distillery: "distilleries",
    sports_bar: "sports_bars",
    cigar: "cigar_lounges",
    cigar_lounge: "cigar_lounges",
    shopping_mall: "malls",
    mall: "malls",
    malls: "malls",
    shopping: "shopping",
    shopping_center: "malls",
    retail: "malls",
    stores: "shopping",
    store: "shopping",
    outlet: "outlets",
    outlets: "outlets",
    thrift: "thrifting",
    antique: "antiques",
    books: "bookstore",
    books_store: "bookstore",
    golf_course: "golf",
    golf_range: "driving_range",
    museum: "museums",
    kids_museum: "childrens_museums",
    children_museum: "childrens_museums",
    childrens_museum: "childrens_museums",
    outdoors: "park",
    outdoor: "park",
    parks: "park",
    hiking: "hiking",
    hike: "hiking",
    trail: "trails",
    trails: "trails",
    garden: "gardens",
    gardens: "gardens",
    botanical_garden: "gardens",
    playground: "playgrounds",
    playgrounds: "playgrounds",
    dog_park: "dog_parks",
    dog_parks: "dog_parks",
    nature: "nature_preserves",
    nature_preserve: "nature_preserves",
    picnic: "picnic_areas",
    picnic_area: "picnic_areas",
    zoo: "zoos",
    aquarium: "aquariums",
    hotel: "hotels",
    main_street: "walkable_main_streets",
    downtown: "downtowns",
    waterfront: "waterfronts",
    college: "engineering_stem",
    colleges: "engineering_stem",
    university: "engineering_stem",
    universities: "engineering_stem"
  };

  const alias = aliases[compact];
  if (alias) return { category: normalizeCategory(alias) };

  return { category: "custom", customQuery: raw };
}

/** True when the query names a searchable activity or venue type — not gibberish like "blah". */
export function hasRecognizablePlacesIntent(query: string, parsedCategory?: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (parseNearFeatureQuery(trimmed)?.relatedFeature) return true;
  if (matchCategoryInQuery(trimmed)) return true;
  if (looksLikeFoodIntent(trimmed)) return true;
  if (isEvChargingIntent(trimmed)) return true;
  if (looksLikeCurrentLocationQuery(trimmed) || isCurrentLocationReference(trimmed)) return true;
  if (/\b(?:meet|meeting|halfway|between|spot|place|fun|tonight|today|weekend)\b/i.test(trimmed)) return true;
  if (/\b(?:near|around|in)\s+\S/i.test(trimmed)) return true;

  const parsed = parsedCategory?.trim();
  if (parsed) {
    const fromParsed = mapCategoryIntent(parsed);
    if (fromParsed.category !== "custom") return true;
    const rematched = matchCategoryInQuery(fromParsed.customQuery ?? parsed);
    if (rematched) return true;
  }

  return false;
}

/** Single-word nonsense like "blah" with no venue or activity signal. */
export function isUnsupportedGibberishQuery(query: string, parsedCategory?: string): boolean {
  if (hasRecognizablePlacesIntent(query, parsedCategory)) return false;
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  return tokens.length === 1 && tokens[0].length <= 12;
}

export function resolveSearchCategoryFromQuery(
  query: string,
  parsedCategory?: string,
  hintedCategory?: VenueCategory
): { category: VenueCategory; customQuery?: string } {
  if (isEvChargingIntent(query) && /\b(?:restaurants?|food|dinner|lunch|brunch|eat|cafe|coffee|bar)\b/i.test(query)) {
    const stripped = stripEvChargingPhrases(query);
    const bareRestaurant = /^(?:restaurants?|food|dinner|lunch|brunch|eat|cafe|coffee|bars?)$/i.test(stripped);
    return bareRestaurant || !stripped
      ? { category: "restaurant" }
      : { category: "restaurant", customQuery: stripped };
  }

  const matched = matchCategoryInQuery(query);
  if (matched) return { category: matched };

  const parsed = parsedCategory?.trim();
  if (parsed) {
    const fromParsed = mapCategoryIntent(parsed);
    if (fromParsed.category !== "custom") return fromParsed;

    const rematched = matchCategoryInQuery(fromParsed.customQuery ?? parsed);
    if (rematched) return { category: rematched };
  }

  if (looksLikeFoodIntent(query)) {
    return { category: "restaurant" };
  }

  if (/\b(?:meet|meeting|halfway|between|spot|place)\b/i.test(query)) {
    return { category: "restaurant" };
  }

  const hint = hintedCategory ? normalizeCategory(hintedCategory) : null;
  if (hint && hint !== "custom" && !isUnsupportedGibberishQuery(query, parsedCategory)) {
    return { category: hint };
  }

  if (parsed) {
    return { category: "custom", customQuery: parsed };
  }

  return { category: "custom", customQuery: query.trim() };
}

function looksLikeFoodIntent(query: string) {
  const normalized = query.toLowerCase().replace(/&/g, "and");
  return (
    /\b(?:worth eating|place to eat|places to eat|where to eat|what to eat|grab a bite|get food|good food|something to eat|hungry|dining out|go eat|out to eat)\b/i.test(
      normalized
    ) ||
    /\b(?:eat|eating|food|dinner|lunch|brunch|restaurant)\b.*\b(?:tonight|today|near me|nearby|around me)\b/i.test(
      normalized
    ) ||
    /\bwhat(?:'s| is)\s+(?:good|worth)\b.*\b(?:eat|food|dinner|lunch|brunch|restaurant)\b/i.test(normalized)
  );
}

function matchCategoryInQuery(query: string): VenueCategory | null {
  const normalized = query.toLowerCase().replace(/&/g, "and");

  const phraseMatches: Array<{ pattern: RegExp; category: VenueCategory }> = [
    { pattern: /\bcoffee shops?\b|\bcafes?\b|\bespresso bars?\b/, category: "coffee" },
    { pattern: /\bbreweries\b|\bbrewpubs?\b|\bcraft beer\b/, category: "breweries" },
    { pattern: /\bcocktail bars?\b|\bspeakeas(?:y|ies)\b/, category: "cocktail_bars" },
    { pattern: /\bwine bars?\b|\bwine tasting\b/, category: "wine_bars" },
    { pattern: /\bsports bars?\b|\bgame day bars?\b/, category: "sports_bars" },
    { pattern: /\brooftop bars?\b/, category: "rooftop_bars" },
    { pattern: /\bcigar lounges?\b/, category: "cigar_lounges" },
    { pattern: /\bsteakhouses?\b|\bchophouses?\b/, category: "steakhouse" },
    { pattern: /\bsushi bars?\b|\bomakase\b/, category: "sushi" },
    { pattern: /\bpizza places?\b|\bpizzerias?\b|\bpizza\b/, category: "pizza" },
    { pattern: /\bitalian restaurants?\b|\btrattorias?\b|\bitalian food\b|\bitalian\b/, category: "italian" },
    { pattern: /\bmexican restaurants?\b|\btaquerias?\b|\btacos?\b|\bmexican\b/, category: "mexican" },
    { pattern: /\bindian restaurants?\b|\bcurry\b|\bindian\b/, category: "indian" },
    { pattern: /\bthai restaurants?\b|\bpad thai\b|\bthai\b/, category: "thai" },
    { pattern: /\bseafood restaurants?\b|\boyster bars?\b|\bseafood\b/, category: "seafood" },
    { pattern: /\bbbq\b|\bbarbecue\b|\bsmokehouses?\b/, category: "bbq" },
    { pattern: /\bbookstores?\b|\bbook shops?\b/, category: "bookstore" },
    { pattern: /\bshopping malls?\b|\bshopping centers?\b|\bretail centers?\b|\boutlet malls?\b|\boutlets?\b/, category: "malls" },
    { pattern: /\bshopping\b|\bretail\b|\bstores?\b|\bmall\b|\bmalls\b/, category: "shopping" },
    { pattern: /\bgolf courses?\b|\bgolf\b/, category: "golf" },
    { pattern: /\bdog parks?\b/, category: "dog_parks" },
    { pattern: /\bbike rides?\b|\bbike trails?\b|\bbike paths?\b|\brail trails?\b|\bgreenways?\b|\bcycling\b|\bgravel\b|\bboardwalk rides?\b/, category: "trails" },
    { pattern: /\bscenic walks?\b|\bwaterfront walks?\b|\bnature walks?\b|\bwalking trails?\b/, category: "scenic_walks" },
    { pattern: /\bhiking trails?\b|\bhiking\b|\btrails?\b/, category: "hiking" },
    { pattern: /\bnational parks?\b|\bpicnic areas?\b|\bparks?\b/, category: "park" },
    { pattern: /\bmuseums?\b/, category: "museums" },
    { pattern: /\bhotels?\b/, category: "hotels" },
    { pattern: /\bbrunch spots?\b|\bbrunch\b/, category: "brunch" },
    { pattern: /\bbreakfast spots?\b|\bbreakfast\b/, category: "breakfast" },
    {
      pattern:
        /\bworth eating\b|\bplace to eat\b|\bplaces to eat\b|\bwhere to eat\b|\bwhat to eat\b|\bgrab a bite\b|\bsomething to eat\b|\beating\b|\beats?\b|\bmeal\b|\bhungry\b/,
      category: "restaurant"
    },
    { pattern: /\brestaurants?\b|\bdinner\b|\blunch\b|\bfood\b|\bdining\b/, category: "restaurant" },
    { pattern: /\bdrinks?\b|\bcocktails?\b|\bbars?\b|\bpubs?\b|\btaverns?\b/, category: "cocktail_bars" }
  ];

  for (const { pattern, category } of phraseMatches) {
    if (category === "park" && /\bparking\b/i.test(normalized) && !/\b(?:dog park|national park|theme park|state park)\b/i.test(normalized)) {
      continue;
    }
    if (pattern.test(normalized)) return category;
  }

  for (const config of [...CATEGORIES].sort((a, b) => b.id.length - a.id.length)) {
    const idPattern = config.id.replace(/_/g, "[\\s_-]+");
    if (new RegExp(`\\b${idPattern}s?\\b`, "i").test(normalized)) {
      return config.id;
    }
    const labelPattern = config.label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${labelPattern}s?\\b`, "i").test(normalized)) {
      return config.id;
    }
  }

  return null;
}

export function parseSearchMode(value: string | null | undefined): SearchMode {
  return value === "single" ? "single" : DEFAULT_SEARCH_MODE;
}

export function parseMeetupMode(_value: string | null | undefined): MeetupMode {
  return DEFAULT_MEETUP_MODE;
}

export function getCategorySearchTerms(
  category: VenueCategory,
  customQuery?: string,
  _meetupMode: MeetupMode = DEFAULT_MEETUP_MODE
) {
  category = normalizeCategory(category);
  if (category === "custom") return [customQuery?.trim() || "places to meet"];
  const config = getCategoryConfig(category);
  if (!config) return ["places to meet"];
  const query = customQuery?.trim();
  if (query) {
    return [query, ...config.searchTerms.single.filter((term) => term.toLowerCase() !== query.toLowerCase())];
  }
  return config.searchTerms.single;
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
