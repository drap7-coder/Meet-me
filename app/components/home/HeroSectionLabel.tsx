import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onPage?: boolean;
};

export function HeroSectionLabel({ children, onPage = false }: Props) {
  if (onPage) {
    return (
      <p className="px-0.5 text-sm font-semibold tracking-wide text-slate sm:text-[0.9375rem]">{children}</p>
    );
  }

  return (
    <p className="px-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/65">{children}</p>
  );
}
