import type { Conference } from "~/types/fosdem";

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function validateYear(year: unknown): number {
  const yearNum = Number.parseInt(String(year));
  if (!Number.isFinite(yearNum) || yearNum < MIN_YEAR || yearNum > MAX_YEAR) {
    throw new Error("Invalid year parameter");
  }
  return yearNum;
}

export function buildIdToSlugMaps(fosdemData: Conference) {
  const eventIdToSlug = new Map<string, string>();
  for (const [slug, event] of Object.entries(fosdemData.events ?? {})) {
    if (event?.id) eventIdToSlug.set(String(event.id), slug);
  }

  const trackIdToSlug = new Map<string, string>();
  for (const [slug, track] of Object.entries(fosdemData.tracks ?? {})) {
    if (track?.id) trackIdToSlug.set(String(track.id), slug);
  }

  return { eventIdToSlug, trackIdToSlug };
}
