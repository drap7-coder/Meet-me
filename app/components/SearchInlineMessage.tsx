type Props = {
  message: string;
  surface?: "hero" | "page";
};

export function SearchInlineMessage({ message, surface = "page" }: Props) {
  const onHero = surface === "hero";

  return (
    <p
      className={`mt-2 px-1 text-xs font-semibold leading-5 ${onHero ? "text-[#FFD4C8]" : "text-events"}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
