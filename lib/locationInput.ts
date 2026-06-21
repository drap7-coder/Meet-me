const ZIP_PATTERN = /^\d{5}$/;
const CITY_PATTERN = /^[a-zA-Z][a-zA-Z\s,.'-]{1,}$/;

export type LocationUiState =
  | "idle"
  | "requesting"
  | "browser_success"
  | "browser_failed"
  | "manual_resolving"
  | "manual_success"
  | "manual_error";

export function isValidManualLocationInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (ZIP_PATTERN.test(trimmed)) return true;
  return CITY_PATTERN.test(trimmed);
}

export function formatLocationStatusLabel(resolvedLabel: string) {
  return `Using location: ${resolvedLabel.trim()}`;
}
