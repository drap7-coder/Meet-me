import type { WatchEventsResult } from "@/lib/types";

type Props = {
  result: WatchEventsResult;
  onNewSearch: () => void;
};

export function WatchEventsPlaceholder({ result, onNewSearch }: Props) {
  return (
    <section className="search-results-enter mt-5 pb-16">
      <article className="rounded-lg border border-line bg-paper p-6 shadow-soft sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-clay">{result.title}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{result.description}</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate">{result.message}</p>

        <div className="mt-6 rounded-lg border border-line bg-mint p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Your ask</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink">“{result.query}”</p>
        </div>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Planned integrations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.futureProviders.map((provider) => (
              <span
                key={provider}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate"
              >
                {provider}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNewSearch}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-line bg-paper px-5 text-sm font-bold text-ink transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-ink/10"
        >
          New search
        </button>
      </article>
    </section>
  );
}
