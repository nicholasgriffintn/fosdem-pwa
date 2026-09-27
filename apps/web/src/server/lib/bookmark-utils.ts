import type { Conference } from "~/types/conference";

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function validateYear(year: unknown): number {
	const yearNum = Number.parseInt(String(year), 10);
	if (!Number.isFinite(yearNum) || yearNum < MIN_YEAR || yearNum > MAX_YEAR) {
		throw new Error("Invalid year parameter");
	}
	return yearNum;
}

export function buildIdToSlugMaps(scheduleData: Conference) {
	const eventIdToSlug = new Map<string, string>();
	for (const [slug, event] of Object.entries(scheduleData.events ?? {})) {
		if (event?.id) eventIdToSlug.set(String(event.id), slug);
	}

	const trackIdToSlug = new Map<string, string>();
	for (const [slug, track] of Object.entries(scheduleData.tracks ?? {})) {
		if (track?.id) trackIdToSlug.set(String(track.id), slug);
	}

	return { eventIdToSlug, trackIdToSlug };
}
