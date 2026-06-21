import { NextResponse } from "next/server";
import { getRedisConfig, redisCommand } from "@/lib/redisRest";

const LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  "/api/search-halfway": { limit: 20, windowSeconds: 60 },
  "/api/parse-search": { limit: 30, windowSeconds: 60 },
  "/api/geocode": { limit: 60, windowSeconds: 60 },
  "/api/place-autocomplete": { limit: 90, windowSeconds: 60 },
  "/api/watch-search": { limit: 30, windowSeconds: 60 },
  "/api/watch-events": { limit: 30, windowSeconds: 60 },
  "/api/share": { limit: 15, windowSeconds: 60 },
  "/api/calendar/ics": { limit: 30, windowSeconds: 60 }
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getLimitForPath(pathname: string) {
  if (pathname.startsWith("/api/share/")) {
    return LIMITS["/api/share"];
  }
  return LIMITS[pathname];
}

export async function enforceRateLimit(request: Request) {
  const pathname = new URL(request.url).pathname;
  const rule = getLimitForPath(pathname);
  if (!rule) return null;

  const ip = getClientIp(request);
  const bucket = `${pathname}:${ip}`;
  const allowed = await consumeToken(bucket, rule.limit, rule.windowSeconds);
  if (allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(rule.windowSeconds)
      }
    }
  );
}

async function consumeToken(bucket: string, limit: number, windowSeconds: number) {
  if (getRedisConfig()) {
    const windowKey = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `ratelimit:${bucket}:${windowKey}`;
    const count = Number(await redisCommand(["INCR", key]));
    if (count === 1) {
      await redisCommand(["EXPIRE", key, String(windowSeconds)]);
    }
    return count <= limit;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("[rateLimit] Redis is not configured; using in-memory fallback (per-instance only).");
  }

  const now = Date.now();
  const entry = memoryBuckets.get(bucket);
  if (!entry || entry.resetAt <= now) {
    memoryBuckets.set(bucket, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}
