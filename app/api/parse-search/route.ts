import { resolveSearchCategoryFromQuery } from "@/lib/categories";
import { detectPreferencesFromQuery } from "@/lib/preferences";
import type { KoiBotMode, SearchHalfwayRequest, WatchEventsResult } from "@/lib/types";
import { buildWatchEventsResult, resolveKoiBotMode } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || (process.env.VERCEL ? "" : "http://localhost:11434");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 30000);
const DEDICATED_GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const NLP_PROVIDER = process.env.NLP_PROVIDER || "";

type ParseSearchResponse = {
  botMode: "places";
  parsed: {
    location_a: string;
    location_b: string;
    category: string;
    search_mode: "single" | "midpoint";
  };
  form: SearchHalfwayRequest;
};

type ParseWatchEventsResponse = {
  botMode: "watch_events";
  watchEvents: WatchEventsResult;
};

type ParsedSearchIntent = {
  location_a: string;
  location_b: string;
  category: string;
  search_mode: "single" | "midpoint";
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const requestedMode = parseRequestedBotMode(body.botMode);
    if (!query) {
      return NextResponse.json({ error: "Tell Koi where you are and what kind of spot you need." }, { status: 400 });
    }

    const botMode = resolveKoiBotMode(query, requestedMode);
    if (botMode === "watch_events") {
      const placeForm = resolveWatchPlaceSearchForm(query);
      if (placeForm) {
        const placeResponse = buildPlacesParseResponse(query, placeForm);
        if (placeResponse) return NextResponse.json(placeResponse);
        return NextResponse.json(
          {
            error:
              "Add a location in classic search below, or include a place in your ask — e.g. sports bar between Hoboken and Edison."
          },
          { status: 422 }
        );
      }

      const response: ParseWatchEventsResponse = {
        botMode: "watch_events",
        watchEvents: await buildWatchEventsResult(query)
      };
      return NextResponse.json(response);
    }

    const parsed = await parseSearchQuery(query);
    const locationA = parsed.location_a.trim();
    const locationB = parsed.location_b.trim();
    const categoryIntent = resolveSearchCategoryFromQuery(query, parsed.category);
    const searchMode =
      parsed.search_mode === "single" || (locationA && !locationB && !looksLikeMidpointQuery(query))
        ? "single"
        : "midpoint";

    if (!locationA || (searchMode === "midpoint" && !locationB)) {
      const followUp =
        locationA || locationB
          ? "I found one place. Should Koi search near it, or are you meeting someone from another location?"
          : "Where should Koi search?";
      return NextResponse.json(
        { error: `${followUp} Try: coffee near Hoboken, or coffee between Hoboken and Edison.` },
        { status: 422 }
      );
    }

    const preferences = detectPreferencesFromQuery(query);
    const form: SearchHalfwayRequest = {
      locationA,
      locationB: searchMode === "single" ? "" : locationB,
      category: categoryIntent.category,
      searchMode,
      meetupMode: "single",
      customQuery: categoryIntent.customQuery ?? "",
      ...(preferences.length ? { preferences } : {})
    };

    const placeResponse = buildPlacesParseResponse(query, form, parsed.category.trim());
    if (!placeResponse) {
      return NextResponse.json(
        { error: "Where should Koi search? Try: coffee near Hoboken, or coffee between Hoboken and Edison." },
        { status: 422 }
      );
    }

    return NextResponse.json(placeResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Natural language search failed.";
    const status = message.includes("Ollama") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

async function parseSearchQuery(query: string): Promise<ParsedSearchIntent> {
  if (shouldUseGeminiParser()) {
    try {
      return await parseWithGemini(query);
    } catch {
      return parseWithFallback(query);
    }
  }

  if (NLP_PROVIDER === "ollama" || OLLAMA_BASE_URL) {
    return parseWithOllama(query);
  }

  return parseWithFallback(query);
}

function shouldUseGeminiParser() {
  if (NLP_PROVIDER === "ollama") return false;
  return Boolean(DEDICATED_GEMINI_KEY);
}

async function parseWithOllama(query: string): Promise<ParsedSearchIntent> {
  if (!OLLAMA_BASE_URL) {
    throw new Error("Ollama parser is not configured. Set OLLAMA_BASE_URL to a server-reachable Ollama endpoint.");
  }
  const controller = new AbortController();
  const timeout = windowlessTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        think: false,
        options: {
          temperature: 0,
          num_predict: 220
        },
        messages: [
          {
            role: "system",
            content: [
              "You parse meetup search intent for Koi, an intelligent local meeting assistant.",
              "Return only JSON with keys location_a, location_b, category, search_mode.",
              "Do not geocode, calculate midpoint, search places, rank venues, or add coordinates.",
              "Use short human-readable place strings. Include state when the user provides or implies it confidently.",
              "Use category as the requested venue/activity type, such as coffee, Italian, breweries, cocktail bars, park, hiking, bookstore, bowling, or ramen.",
              "Use search_mode midpoint when the user wants a place between two locations.",
              "Use search_mode single when the user wants places near, in, or around one location. For single searches, put the place in location_a and leave location_b empty.",
              "If a value is missing, return an empty string for that key.",
              "Example: Meet for coffee halfway between Hoboken and Edison -> {\"location_a\":\"Hoboken, NJ\",\"location_b\":\"Edison, NJ\",\"category\":\"coffee\",\"search_mode\":\"midpoint\"}.",
              "Example: Find coffee near Hoboken -> {\"location_a\":\"Hoboken, NJ\",\"location_b\":\"\",\"category\":\"coffee\",\"search_mode\":\"single\"}."
            ].join("\n")
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama parse failed with ${response.status}: ${text.slice(0, 180)}`);
    }

    const data = await response.json();
    const parsed = parseJsonObject(data.message?.content);

    return {
      location_a: stringField(parsed.location_a),
      location_b: stringField(parsed.location_b),
      category: stringField(parsed.category),
      search_mode: stringField(parsed.search_mode) === "single" ? "single" : "midpoint"
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Ollama parse timed out after ${OLLAMA_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseWithGemini(query: string): Promise<ParsedSearchIntent> {
  if (!DEDICATED_GEMINI_KEY) throw new Error("Gemini parser is not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(DEDICATED_GEMINI_KEY)}`,
    {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildParserPrompt(query)
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini parse failed with ${response.status}: ${text.slice(0, 180)}`);
  }

  const data = await response.json();
  const parsed = parseJsonObject(data.candidates?.[0]?.content?.parts?.[0]?.text);

  return {
    location_a: stringField(parsed.location_a),
    location_b: stringField(parsed.location_b),
    category: stringField(parsed.category),
    search_mode: stringField(parsed.search_mode) === "single" ? "single" : "midpoint"
  };
}

function buildParserPrompt(query: string) {
  return [
    "You parse meetup search intent for Koi, an intelligent local meeting assistant.",
    "Return only JSON with keys location_a, location_b, category, search_mode.",
    "Do not geocode, calculate midpoint, search places, rank venues, or add coordinates.",
    "Use short human-readable place strings. Include state when the user provides or implies it confidently.",
    "Use category as the requested venue/activity type, such as coffee, Italian, breweries, cocktail bars, park, hiking, bookstore, bowling, or ramen.",
    "Use search_mode midpoint when the user wants a place between two locations.",
    "Use search_mode single when the user wants places near, in, or around one location. For single searches, put the place in location_a and leave location_b empty.",
    "If a value is missing, return an empty string for that key.",
    "Example: Meet for coffee halfway between Hoboken and Edison -> {\"location_a\":\"Hoboken, NJ\",\"location_b\":\"Edison, NJ\",\"category\":\"coffee\",\"search_mode\":\"midpoint\"}.",
    "Example: Find coffee near Hoboken -> {\"location_a\":\"Hoboken, NJ\",\"location_b\":\"\",\"category\":\"coffee\",\"search_mode\":\"single\"}.",
    "",
    `User query: ${query}`
  ].join("\n");
}

function parseWithFallback(query: string): ParsedSearchIntent {
  const match = query.match(/\bbetween\s+(.+?)\s+(?:and|&)\s+(.+?)(?:\s+(?:with|for|near|that|where|$).*)?$/i);
  if (!match) {
    const singleMatch = query.match(/\b(?:near|around|in)\s+(.+?)(?:\s+(?:with|that|where|open|$).*)?$/i);
    return {
      location_a: singleMatch ? cleanupLocation(singleMatch[1]) : "",
      location_b: "",
      category: guessCategory(query),
      search_mode: singleMatch ? "single" : "midpoint"
    };
  }

  return {
    location_a: cleanupLocation(match[1]),
    location_b: cleanupLocation(match[2]),
    category: guessCategory(query),
    search_mode: "midpoint"
  };
}

function cleanupLocation(value: string) {
  return value
    .replace(/^(me|us|everyone|people)\s+/i, "")
    .replace(/\b(halfway|midway|in the middle)\b/gi, "")
    .replace(/[?.!,]+$/g, "")
    .trim();
}

function guessCategory(query: string) {
  return resolveSearchCategoryFromQuery(query).category;
}

function looksLikeMidpointQuery(query: string) {
  return /\b(?:between|halfway|midway|middle)\b/i.test(query);
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") throw new Error("Parser did not return parseable JSON.");
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    }
  }
  throw new Error("Parser did not return parseable JSON.");
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRequestedBotMode(value: unknown): KoiBotMode | undefined {
  return value === "watch_events" || value === "places" ? value : undefined;
}

function buildPlacesParseResponse(
  query: string,
  form: SearchHalfwayRequest,
  parsedCategory = ""
): ParseSearchResponse | null {
  const locationA = form.locationA.trim();
  const locationB = form.locationB.trim();
  const searchMode = form.searchMode ?? "midpoint";

  if (!locationA || (searchMode === "midpoint" && !locationB)) {
    return null;
  }

  const preferences = detectPreferencesFromQuery(query);
  const nextForm: SearchHalfwayRequest = {
    ...form,
    ...(preferences.length ? { preferences } : {})
  };

  return {
    botMode: "places",
    parsed: {
      location_a: locationA,
      location_b: searchMode === "single" ? "" : locationB,
      category:
        nextForm.category === "custom"
          ? nextForm.customQuery ?? parsedCategory.trim()
          : nextForm.category,
      search_mode: searchMode
    },
    form: nextForm
  };
}

function windowlessTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}
