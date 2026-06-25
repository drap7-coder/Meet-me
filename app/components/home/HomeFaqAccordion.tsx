"use client";

import type { HomeFaqItem } from "@/src/config/homeFaq";
import { useState } from "react";

type Props = {
  items: HomeFaqItem[];
  title?: string;
};

export function HomeFaqAccordion({ items, title = "Learn what Koi can do" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = items.filter((item) => !item.featured).length;

  return (
    <section className="w-full min-w-0" aria-labelledby="home-faq-heading">
      <h2 id="home-faq-heading" className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/45">
        {title}
      </h2>
      <div className="mt-3 grid min-w-0 gap-1.5">
        {items.map((item) => (
          <details
            key={item.id}
            className={`group rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 open:bg-white/[0.05] ${
              !expanded && !item.featured ? "hidden" : ""
            }`}
          >
            <summary className="cursor-pointer list-none text-[0.8125rem] font-semibold leading-snug text-white/90 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[0.65rem] font-black text-white/40 transition group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-[0.8125rem] font-medium leading-6 text-white/60">{item.answer}</p>
          </details>
        ))}
      </div>
      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2.5 text-sm font-semibold text-koi transition hover:text-koi-hover"
        >
          Show {hiddenCount} more
        </button>
      ) : null}
    </section>
  );
}
