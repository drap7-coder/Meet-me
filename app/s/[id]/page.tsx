import { getShare, sharePayloadToSearchRequest } from "@/lib/shareStore";
import { redirect } from "next/navigation";

export default async function SharedMeetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getShare(id);

  if (!payload) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-center text-ink">
        <div className="max-w-md rounded-lg border border-line bg-paper p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-koi">Koi</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Meetup link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate">
            This shared meetup may have expired or storage may not be configured.
          </p>
          <a
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-koi px-5 text-sm font-bold text-white"
          >
            Start a new search
          </a>
        </div>
      </main>
    );
  }

  const request = sharePayloadToSearchRequest(payload);
  const query = new URLSearchParams();
  query.set("a", request.locationA);
  if (request.locationAPlaceId) query.set("aPlaceId", request.locationAPlaceId);
  if (request.searchMode === "single") {
    query.set("searchMode", "single");
  } else {
    query.set("b", request.locationB);
    if (request.locationBPlaceId) query.set("bPlaceId", request.locationBPlaceId);
  }
  query.set("category", request.category);
  if (request.meetupMode && request.meetupMode !== "single") query.set("mode", request.meetupMode);
  if (request.customQuery) query.set("q", request.customQuery);
  if (request.preferences?.length) query.set("preferences", request.preferences.join(","));
  query.set("shareId", id);
  query.set("auto", "1");

  redirect(`/?${query.toString()}`);
}
