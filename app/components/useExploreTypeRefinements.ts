"use client";

import { exploreRefinementsFor, type ExploreCategory } from "@/lib/exploreIntent";
import type { BuilderRefinement } from "@/lib/searchBuilderOptions";
import { useEffect, useMemo, useState } from "react";

export function useExploreTypeRefinements(category: ExploreCategory | null): BuilderRefinement[] {
  const staticRefinements = useMemo(
    () => (category ? exploreRefinementsFor(category) : []),
    [category]
  );
  const [remoteRefinements, setRemoteRefinements] = useState<BuilderRefinement[] | null>(null);

  useEffect(() => {
    if (!category || category !== "outdoors") {
      setRemoteRefinements(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/explore-refinements?category=${category}`)
      .then((response) => (response.ok ? response.json() : { refinements: staticRefinements }))
      .then((payload: { refinements?: BuilderRefinement[] }) => {
        if (!cancelled) setRemoteRefinements(payload.refinements ?? staticRefinements);
      })
      .catch(() => {
        if (!cancelled) setRemoteRefinements(staticRefinements);
      });

    return () => {
      cancelled = true;
    };
  }, [category, staticRefinements]);

  return remoteRefinements ?? staticRefinements;
}
