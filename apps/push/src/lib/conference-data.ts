import { constants } from "../constants";
import { getCurrentDate } from "../utils/date";
import type { ConferenceSchedule } from "../types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_WHILE_REVALIDATE_MS = 5 * 60 * 1000;

let cachedData: {
	value: ConferenceSchedule;
	expiresAt: number;
	staleUntil: number;
} | null = null;
let inflight: Promise<ConferenceSchedule> | null = null;

function getDataLink() {
	const year = constants.YEAR;
	return constants.DATA_LINK.replace("${YEAR}", year.toString());
}

async function fetchAndCache(): Promise<ConferenceSchedule> {
	const scheduleDataLink = getDataLink();
	const response = await fetch(scheduleDataLink, {
		cf: {
			cacheTtl: CACHE_TTL_MS / 1000,
			cacheEverything: true,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch data from ${scheduleDataLink}`);
	}

	const json = (await response.json()) as ConferenceSchedule;
	const now = Date.now();
	cachedData = {
		value: json,
		expiresAt: now + CACHE_TTL_MS,
		staleUntil: now + CACHE_TTL_MS + STALE_WHILE_REVALIDATE_MS,
	};
	return json;
}

export async function getConferenceData(): Promise<ConferenceSchedule> {
	const now = Date.now();

	if (cachedData && now < cachedData.expiresAt) {
		return cachedData.value;
	}

	if (cachedData && now < cachedData.staleUntil) {
		if (!inflight) {
			inflight = fetchAndCache().finally(() => {
				inflight = null;
			});
			void inflight.catch((error) =>
				console.error("Schedule refresh failed", error),
			);
		}
		return cachedData.value;
	}

	inflight ??= fetchAndCache();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}

export function getCurrentDay(): string | undefined {
	const todayString = getCurrentDate();

	return todayString in constants.DAYS_MAP
		? constants.DAYS_MAP[todayString as keyof typeof constants.DAYS_MAP]
		: undefined;
}
