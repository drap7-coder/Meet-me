import { createShare, type SharePayload } from "@/lib/shareStore";
import type { SearchHalfwayRequest, SearchHalfwayResponse } from "@/lib/types";
import { NextResponse } from "next/server";

type ShareRequest = {
  form: SearchHalfwayRequest;
  results?: SearchHalfwayResponse;
  selectedResultIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShareRequest;
    const searchMode = body.form?.searchMode ?? "midpoint";
    if (!body.form?.locationA?.trim() || (searchMode === "midpoint" && !body.form?.locationB?.trim())) {
      return NextResponse.json({ error: "A completed meetup search is required." }, { status: 400 });
    }

    const payload: SharePayload = {
      locationA: {
        label: safeLocationLabel(body.results?.originA.formattedAddress || body.form.locationA),
        placeId: body.results?.originA.placeId || body.form.locationAPlaceId
      },
      locationB: {
        label: safeLocationLabel(body.results?.originB.formattedAddress || body.form.locationB),
        placeId: body.results?.originB.placeId || body.form.locationBPlaceId
      },
      category: body.form.category,
      searchMode,
      meetupMode: body.form.meetupMode,
      customQuery: body.form.customQuery,
      preferences: body.form.preferences ?? [],
      midpoint: body.results?.midpoint,
      selectedResultIds: body.selectedResultIds ?? body.results?.venues.slice(0, 5).map((venue) => venue.id),
      recommendations: body.results?.venues.slice(0, 5).map((venue) => ({
        id: venue.id,
        name: venue.name,
        category: venue.category,
        googleMapsUri: venue.googleMapsUri
      })),
      createdAt: new Date().toISOString()
    };

    const shortId = await createShare(payload);
    const shareUrl = new URL(`/s/${shortId}`, getAppUrl(request)).toString();

    return NextResponse.json({ shortId, shareUrl });
  } catch (error) {
    console.warn("[api/share] Share link creation failed.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Share link creation failed." },
      { status: 500 }
    );
  }
}

function getAppUrl(request: Request) {
  const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
  return requestOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function safeLocationLabel(value: string) {
  return value.split(",").slice(0, 2).join(",").trim() || "Location";
}
