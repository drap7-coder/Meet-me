import {
  createShare,
  getShare,
  sharePayloadToSearchRequest
} from "@/lib/shareStore";
import type { StorageProvider } from "@/lib/providers/types";

export const storageProvider: StorageProvider = {
  createShare,
  getShare,
  sharePayloadToSearchRequest
};
