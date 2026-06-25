const ZIP_PATTERN = /^\d{5}$/;
const CITY_PATTERN = /^[a-zA-Z][a-zA-Z\s,.'-]{1,}$/;

export type LocationManualEntry = {
  address: string;
  addressPlaceId?: string;
  zip: string;
  zipPlaceId?: string;
};

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

/** Prefer address/city when both fields are filled. */
export function resolveManualEntryInput(entry: LocationManualEntry): { input: string; placeId?: string } {
  const address = entry.address.trim();
  const zip = entry.zip.trim();
  if (address) return { input: address, placeId: entry.addressPlaceId };
  if (zip) return { input: zip, placeId: entry.zipPlaceId };
  return { input: "", placeId: undefined };
}

export function seedManualLocationFields(
  label: string,
  placeId?: string
): LocationManualEntry {
  const trimmed = label.trim();
  if (ZIP_PATTERN.test(trimmed)) {
    return { address: "", addressPlaceId: undefined, zip: trimmed, zipPlaceId: placeId };
  }
  return { address: trimmed, addressPlaceId: placeId, zip: "", zipPlaceId: undefined };
}

export function formatLocationStatusLabel(resolvedLabel: string) {
  return `Using location: ${resolvedLabel.trim()}`;
}

export function parseLocationStatusLabel(status: string) {
  return status.replace(/^Using location:\s*/i, "").trim();
}
