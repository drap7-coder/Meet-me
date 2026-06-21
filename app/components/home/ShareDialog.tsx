"use client";

import { copyTextToClipboard } from "@/lib/share";
import { useState } from "react";

export type ShareDialogState = {
  title: string;
  url: string;
  subject: string;
  body: string;
};

export function ShareDialog({
  dialog,
  onCopied,
  onClose
}: {
  dialog: ShareDialogState;
  onCopied: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("");
  const mailto = `mailto:?subject=${encodeURIComponent(dialog.subject)}&body=${encodeURIComponent(dialog.body)}`;

  async function copyLink() {
    const copied = await copyTextToClipboard(dialog.url);
    setStatus(copied ? "Link copied" : "Copy failed. Try Email Results instead.");
    if (copied) onCopied();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-3 sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[24px] border border-line bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-koi">Share</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{dialog.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-slate transition hover:border-koi hover:text-koi"
          >
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-11 items-center justify-center rounded-full bg-koi px-4 text-sm font-bold text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25"
          >
            Copy Link
          </button>
          <a
            href={mailto}
            onClick={() => setStatus("Email draft opened.")}
            className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-bold text-ink transition hover:border-koi hover:text-koi focus:outline-none focus:ring-4 focus:ring-ink/10"
          >
            Email Results
          </a>
        </div>
        {status ? <p className="mt-3 text-center text-xs font-semibold text-slate">{status}</p> : null}
      </div>
    </div>
  );
}
