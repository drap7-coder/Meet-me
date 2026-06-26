type ExploreCategory =
  | "food_drink"
  | "nightlife"
  | "events"
  | "sports"
  | "activities"
  | "outdoors";

export type QueryClassification = {
  category: ExploreCategory;
  subcategoryId: string | null;
};

type ClassificationRule = {
  category: ExploreCategory;
  subcategoryId: string | null;
  pattern: RegExp;
};

/** Ordered rules — first match wins. More specific patterns appear before broad ones. */
const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    category: "nightlife",
    subcategoryId: "sports_bars",
    pattern: /\bsports bars?\b|\bgame day bars?\b/i
  },

  // Live sports → Ticketmaster
  {
    category: "sports",
    subcategoryId: null,
    pattern: /\b(?:game tonight|games tonight|live sports|yankees|mets|eagles|phillies| vs\.| vs )\b/i
  },
  {
    category: "sports",
    subcategoryId: null,
    pattern: /\b(?:football|baseball|basketball|hockey|soccer)\b.*\b(?:game|games|tickets?)\b/i
  },

  // Ticketed live events
  {
    category: "events",
    subcategoryId: "concerts",
    pattern: /\b(?:concerts?|live music|gigs?)\b/i
  },
  {
    category: "events",
    subcategoryId: "festivals",
    pattern: /\b(?:street fairs?|street festivals?|festivals?|festa|feast|carnival|flea markets?|swap meet|art walks?|pop[- ]?ups?|holiday markets?|seasonal markets?|food festivals?)\b/i
  },
  {
    category: "events",
    subcategoryId: "comedy",
    pattern: /\b(?:comedy|stand[- ]?up|theater|theatre|show tonight|tickets)\b/i
  },
  {
    category: "events",
    subcategoryId: null,
    pattern: /\bevents?\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:things to do|fun|plans?|what should we do|what to do|what(?:'s| is) happening|ideas?|date ideas?|family things?)\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:weekend ideas?|today ideas?|tonight ideas?)\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /^(?:tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)$/i
  },

  // Places-first food & drink
  {
    category: "food_drink",
    subcategoryId: "farmers_markets",
    pattern: /\b(?:farmers? markets?|farm market|produce market|public market)\b/i
  },
  {
    category: "food_drink",
    subcategoryId: "sushi",
    pattern: /\bsushi\b/i
  },
  {
    category: "food_drink",
    subcategoryId: "italian",
    pattern: /\bitalian\b/i
  },
  {
    category: "food_drink",
    subcategoryId: "pizza",
    pattern: /\bpizza\b/i
  },
  {
    category: "food_drink",
    subcategoryId: "brunch",
    pattern: /\bbrunch\b/i
  },
  {
    category: "food_drink",
    subcategoryId: "coffee",
    pattern: /\bcoffee\b/i
  },
  {
    category: "food_drink",
    subcategoryId: null,
    pattern: /\b(?:restaurant|eat|dinner|lunch|food|brewery)\b/i
  },

  // Places-first nightlife
  {
    category: "nightlife",
    subcategoryId: null,
    pattern: /\b(?:cocktail|nightlife|dance club|lounge|rooftop bar|late[\s-]?night)\b/i
  },

  // OpenTripMap-friendly — specific subcategories
  {
    category: "outdoors",
    subcategoryId: "gardens",
    pattern: /\b(?:botanical gardens?|arboretum|flower garden)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "gardens",
    pattern: /\bgardens?\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "overlooks",
    pattern: /\b(?:scenic overlook|overlooks?|viewpoints?|vistas?|scenic view)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "trails",
    pattern: /\b(?:bike ride|bike rides|bike trails?|bike paths?|rail trails?|greenways?|cycling|gravel|boardwalk ride)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "scenic_walks",
    pattern: /\b(?:scenic walks?|waterfront walks?|nature walks?|scenic strolls?)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "hiking",
    pattern: /\b(?:hike|hiking|hiking trails?|walking trails?|trailheads?|waterfall)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "parks",
    pattern: /\b(?:national parks?|state parks?|city parks?)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "parks",
    pattern: /\bparks?\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "nature_preserves",
    pattern: /\b(?:nature preserves?|wildlife refuge|nature sanctuary)\b/i
  },
  {
    category: "activities",
    subcategoryId: "landmarks",
    pattern: /\b(?:historic sites?|historic places?|heritage sites?|historical landmarks?)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "waterfront",
    pattern: /\b(?:waterfront|waterfront walks?|riverwalk|boardwalks?|harbor walks?)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: "scenic_drives",
    pattern: /\b(?:scenic (?:walk|drive|route|stroll)|best scenic walk)\b/i
  },
  {
    category: "activities",
    subcategoryId: "golf",
    pattern: /\b(?:golf courses?|driving ranges?|pickleball courts?|batting cages?)\b/i
  },
  {
    category: "activities",
    subcategoryId: "museums",
    pattern: /\b(?:museums?|art museums?)\b/i
  },
  {
    category: "activities",
    subcategoryId: "public_art",
    pattern: /\b(?:public art|street art|murals?|sculpture garden)\b/i
  },
  {
    category: "activities",
    subcategoryId: "landmarks",
    pattern: /\b(?:landmarks?|monuments?|must[- ]see (?:sights?|spots?))\b/i
  },
  {
    category: "activities",
    subcategoryId: "landmarks",
    pattern: /\b(?:architecture|architectural (?:sites?|landmarks?|tours?))\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:family activit(?:y|ies)|kid[s']? activit(?:y|ies))\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:attractions? near|tourist attractions?|places to visit)\b/i
  },

  // OpenTripMap-friendly — broad outdoors / activities
  {
    category: "outdoors",
    subcategoryId: null,
    pattern: /\b(?:things to do outside|outdoor activit(?:y|ies)|do something outside)\b/i
  },
  {
    category: "outdoors",
    subcategoryId: null,
    pattern: /\b(?:hike|hiking|trails?|rail trails?|greenways?|bike trails?|cycling|gravel|waterfall|garden|waterfront|overlook|scenic|nature preserve|boardwalks?)\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:things to do near|things to do nearby|what to do near)\b/i
  },
  {
    category: "activities",
    subcategoryId: "mini_golf",
    pattern: /\b(?:mini golf|miniature golf|putt[- ]?putt)\b/i
  },
  {
    category: "activities",
    subcategoryId: "bowling",
    pattern: /\bbowling\b/i
  },
  {
    category: "activities",
    subcategoryId: null,
    pattern: /\b(?:arcade|museum|spa|axe throwing|thrift|vintage|antique|record store|used book|architectural salvage|secondhand)\b/i
  }
];

const OPEN_TRIPMAP_FRIENDLY_PATTERN =
  /\b(?:farmers? markets?|scenic|overlook|viewpoint|hike|hiking|trails?|bike trails?|rail trails?|greenways?|cycling|gravel|boardwalks?|waterfall|park|garden|botanical|waterfront|nature preserve|historic (?:sites?|places?)|public art|street art|murals?|landmarks?|monuments?|architecture|museums?|attractions?|family activit(?:y|ies)|outdoor activit(?:y|ies)|things to do outside|things to do near)\b/i;

export function classifyExploreQuery(query: string): QueryClassification | null {
  const value = query.trim();
  if (!value) return null;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(value)) {
      if (rule.category === "sports" && /\bsports bar\b/i.test(value)) continue;
      return { category: rule.category, subcategoryId: rule.subcategoryId };
    }
  }

  return null;
}

/** True when a plain-language query should prefer OpenTripMap discovery over Ticketmaster-only. */
export function isOpenTripMapFriendlyQuery(query: string): boolean {
  const classified = classifyExploreQuery(query);
  if (!classified) return false;
  if (classified.subcategoryId === "farmers_markets") return true;
  if (classified.category === "events" || classified.category === "sports") return false;
  if (classified.category === "food_drink" || classified.category === "nightlife") return false;
  if (classified.category === "outdoors" || classified.category === "activities") return true;
  return OPEN_TRIPMAP_FRIENDLY_PATTERN.test(query.trim());
}

export function inferExploreCategoryFromQuery(query: string): ExploreCategory | null {
  return classifyExploreQuery(query)?.category ?? null;
}

export function inferExploreSubcategoryFromQuery(
  category: ExploreCategory,
  query: string,
  explicitSubcategoryId: string | null = null
): string | null {
  if (explicitSubcategoryId) return explicitSubcategoryId;

  const classified = classifyExploreQuery(query);
  if (classified && classified.category === category && classified.subcategoryId) {
    return classified.subcategoryId;
  }

  return null;
}
