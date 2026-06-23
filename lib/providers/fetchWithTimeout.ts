export type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs?: number;
  timeoutMessage?: string;
};

export async function fetchWithTimeout(input: RequestInfo | URL, options: FetchWithTimeoutOptions = {}) {
  const { timeoutMs = 15000, timeoutMessage, signal, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(timeoutMessage ?? `Request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
