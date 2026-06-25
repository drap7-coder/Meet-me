"use client";

import { TRAVEL_MODE_OPTIONS, travelModeChipLabel } from "@/lib/travelMode";
import type { TravelMode } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  busy?: boolean;
  surface?: "hero" | "page";
};

type MenuRect = {
  top: number;
  right: number;
  width: number;
};

/**
 * Compact "Getting Around" selector that sits beside the persistent location bar.
 * Menu renders in a portal so it stacks above hero chips (Streaming / Explore emojis).
 */
export function TravelModeSelector({ value, onChange, busy = false, surface = "hero" }: Props) {
  const onPage = surface === "page";
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuRect = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      width: 224
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, updateMenuRect]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function selectMode(mode: TravelMode) {
    onChange(mode);
    setOpen(false);
  }

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;
      if (next) updateMenuRect();
      return next;
    });
  }

  const menu =
    open && menuRect ? (
      <div
        ref={menuRef}
        role="listbox"
        aria-label="Getting around"
        className="overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-[0_16px_40px_rgba(10,19,35,0.18)]"
        style={{
          position: "fixed",
          top: menuRect.top,
          right: menuRect.right,
          width: menuRect.width,
          zIndex: 9999
        }}
      >
        {TRAVEL_MODE_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={option.disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => !option.disabled && selectMode(option.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                option.disabled
                  ? "cursor-not-allowed opacity-55"
                  : selected
                    ? "bg-koi/10"
                    : "hover:bg-sky"
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-ink">{option.label}</span>
                  {option.note ? (
                    <span className="rounded-full bg-slate/10 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate">
                      {option.note}
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs font-medium text-slate">{option.description}</span>
              </span>
              {selected ? (
                <span aria-hidden="true" className="text-sm font-black text-koi">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Getting around: ${travelModeChipLabel(value)}`}
        className={
          onPage
            ? "inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-sm font-bold text-ink shadow-soft transition hover:border-koi/40 focus:outline-none focus:ring-2 focus:ring-koi/20 disabled:opacity-50"
            : "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
        }
      >
        <span>{travelModeChipLabel(value)}</span>
        <span aria-hidden="true" className={`text-[0.65rem] transition ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
