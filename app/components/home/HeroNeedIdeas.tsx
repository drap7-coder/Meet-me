"use client";

import { NEED_IDEAS_ITEMS } from "@/src/config/needIdeas";
import { useState } from "react";

type Props = {
  busy?: boolean;
  onSelect: (query: string) => void;
};

export function HeroNeedIdeas({ busy = false, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = NEED_IDEAS_ITEMS.filter((item) => !item.featured).length;

  return (
    <section className="grid min-w-0 gap-3" aria-labelledby="need-ideas-heading">
      <h2 id="need-ideas-heading" className="px-0.5 text-sm font-semibold text-white">
        Need ideas?
      </h2>
      <div className="grid min-w-0 gap-1.5">
        {NEED_IDEAS_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(item.query)}
            className={`rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-[0.8125rem] font-medium leading-snug text-white transition hover:border-white/18 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 ${
              !expanded && !item.featured ? "hidden" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="justify-self-start text-sm font-semibold text-koi transition hover:text-koi-hover"
        >
          Show more
        </button>
      ) : null}
    </section>
  );
}
