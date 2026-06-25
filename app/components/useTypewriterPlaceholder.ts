"use client";

import { useEffect, useState } from "react";

export const KOI_SEARCH_PLACEHOLDER = "ask koi...";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTypewriterPlaceholder(active: boolean, phrase = KOI_SEARCH_PLACEHOLDER) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }

    if (prefersReducedMotion()) {
      setText(phrase);
      return;
    }

    let index = 0;
    let deleting = false;
    let timeout = 0;

    const schedule = (delay: number, step: () => void) => {
      timeout = window.setTimeout(step, delay);
    };

    const tick = () => {
      if (!deleting) {
        index += 1;
        setText(phrase.slice(0, index));
        if (index >= phrase.length) {
          deleting = true;
          schedule(2400, tick);
          return;
        }
        schedule(index <= 3 ? 110 : 70, tick);
        return;
      }

      index -= 1;
      setText(phrase.slice(0, index));
      if (index <= 0) {
        deleting = false;
        schedule(500, tick);
        return;
      }
      schedule(40, tick);
    };

    schedule(350, tick);

    return () => window.clearTimeout(timeout);
  }, [active, phrase]);

  return text;
}
