export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-ink/20 bg-white/70 p-8 text-center">
      <h3 className="text-lg font-bold text-ink">No fair spots yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/65">
        Try a broader category, a custom search like "casual dinner", or locations with a bit more overlap.
      </p>
    </div>
  );
}
