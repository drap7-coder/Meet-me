type SharePayload = {
  title: string;
  text: string;
  url?: string;
};

export type ShareResult = "shared" | "copied" | "email" | "cancelled";

export async function shareWithFallback({ title, text, url }: SharePayload): Promise<ShareResult> {
  const fullText = [text, url].filter(Boolean).join("\n\n");

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (isCancelledShare(error)) return "cancelled";
    }
  }

  if (await copyToClipboard(fullText)) return "copied";

  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(fullText);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  return "email";
}

function isCancelledShare(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function copyToClipboard(text: string) {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection-based copy path.
  }

  return copyWithTemporarySelection(text);
}

function copyWithTemporarySelection(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
