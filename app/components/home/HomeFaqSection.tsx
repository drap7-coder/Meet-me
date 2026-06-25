import { FAQ_ITEMS, faqPageJsonLd } from "@/src/config/seo";

export function HomeFaqSection() {
  return (
    <section className="w-full min-w-0" aria-labelledby="home-faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd()) }}
      />
      <h2 id="home-faq-heading" className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/45">
        Common questions
      </h2>
      <div className="mt-4 grid min-w-0 gap-2">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 open:bg-white/[0.06]"
          >
            <summary className="cursor-pointer list-none text-sm font-bold leading-snug text-white marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-xs font-black text-white/45 transition group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2.5 text-sm font-medium leading-6 text-white/65">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
