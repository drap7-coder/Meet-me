export function EmptyState({
  title = "No great spots yet",
  description = 'Try a broader vibe, a custom idea like "casual dinner", or two places with a little more overlap.'
}: {
  title?: string;
  description?: string;
} = {}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper p-8 text-center shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <h3 className="text-lg font-black text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate">{description}</p>
    </div>
  );
}
