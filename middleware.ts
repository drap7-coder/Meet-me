import { enforceRateLimit } from "@/lib/rateLimit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*"
};
