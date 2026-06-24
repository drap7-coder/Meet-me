"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

export function FeedbackTrigger() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, replyEmail: replyEmail.trim() || undefined })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not send feedback.");
      }

      setStatus("success");
      setMessage("");
      setReplyEmail("");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Could not send feedback.");
    }
  }

  function closeDialog() {
    setOpen(false);
    if (status === "success") {
      setStatus("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex font-bold text-koi hover:text-koi/80"
      >
        Send Feedback -&gt;
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="w-[min(100vw-2rem,28rem)] rounded-2xl border border-line/80 bg-paper p-0 text-ink shadow-[0_24px_64px_rgba(10,19,35,0.18)] backdrop:bg-ink/55"
      >
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Send feedback</h2>
              <p className="mt-1 text-sm leading-6 text-slate">Questions, ideas, or bugs — we&apos;d love to hear from you.</p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close feedback form"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate transition hover:bg-ink/5 hover:text-ink"
            >
              ×
            </button>
          </div>

          {status === "success" ? (
            <p className="rounded-xl border border-koi/25 bg-koi/10 px-4 py-3 text-sm font-semibold leading-6 text-ink" role="status">
              Thanks — your note is in. We read every message.
            </p>
          ) : (
            <>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Your feedback
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  required
                  minLength={8}
                  maxLength={4000}
                  placeholder="What would make Koi more useful?"
                  className="koi-field min-h-[7rem] w-full resize-y px-4 py-3 text-base font-normal outline-none transition"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Email <span className="font-normal text-slate">(optional)</span>
                <input
                  type="email"
                  value={replyEmail}
                  onChange={(event) => setReplyEmail(event.target.value)}
                  placeholder="If you want a reply"
                  autoComplete="email"
                  className="koi-field h-11 w-full px-4 text-base font-normal outline-none transition"
                />
              </label>
              {error ? (
                <p className="text-sm font-semibold leading-6 text-events" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-10 items-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink transition hover:border-koi/45 hover:bg-koi/8"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex h-10 items-center rounded-full bg-koi px-4 text-sm font-bold text-white transition hover:bg-koi-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
