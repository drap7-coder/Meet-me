import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onPage?: boolean;
  subtle?: boolean;
};

export function HeroSectionLabel({ children, onPage = false, subtle = false }: Props) {
  if (onPage) {
    return (
      <p className="px-0.5 text-sm font-semibold tracking-wide text-slate sm:text-[0.9375rem]">{children}</p>
    );
  }

  if (subtle) {
    return (
      <p className="px-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white/42">{children}</p>
    );
  }

  return (
    <p className="px-0.5 text-sm font-semibold text-white/70">{children}</p>
  );
}
