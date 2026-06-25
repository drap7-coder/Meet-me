import { exploreRefinementsWithNps } from "@/lib/npsExploreCatalog";
import { isExploreCategory, type ExploreCategory } from "@/lib/exploreIntent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  if (!category || !isExploreCategory(category)) {
    return NextResponse.json({ refinements: [] });
  }

  const refinements = await exploreRefinementsWithNps(category as ExploreCategory);

  return NextResponse.json({
    category,
    refinements
  });
}
