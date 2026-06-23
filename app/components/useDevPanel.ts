"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "koi-dev-panel";

export function useDevPanel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
    const fromEnv = process.env.NEXT_PUBLIC_ENABLE_DEV_PANEL === "true";
    const fromSession = sessionStorage.getItem(STORAGE_KEY) === "1";
    setEnabled(fromEnv || fromSession);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      if (next) sessionStorage.setItem(STORAGE_KEY, "1");
      else sessionStorage.removeItem(STORAGE_KEY);
      return next;
    });
  }, []);

  return { enabled, toggle };
}
