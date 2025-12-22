import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import type { Conference } from "~/types/fosdem";

const FETCH_TIMEOUT_MS = 8000;
const SPLIT_FILES_YEAR = 2026;

const getFullData = async (year: number): Promise<Conference> => {
	if (!Number.isInteger(year) || year < 2000 || year > 2100) {
		throw new Error("Invalid year; expected YYYY between 2000-2100");
	}

	const url = constants.DATA_LINK.replace("${YEAR}", year.toString());

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	let response: Response;

	try {
		response = await fetch(url, {
			signal: controller.signal,
			cf: { cacheTtl: 300, cacheEverything: true },
		});
	} catch (error) {
		if ((error as Error)?.name === "AbortError") {
			throw new Error("Fetching conference data timed out");
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}

	if (!response.ok) {
		throw new Error(
			`Failed to fetch data: ${response.status} ${response.statusText}`,
		);
	}

	const json = await response.json();

	if (!json || typeof json !== "object" || !("conference" in json)) {
		throw new Error(`Invalid conference data format: ${JSON.stringify(json)}`);
	}

	return json as Conference;
};

const fetchJsonWithTimeout = async (url: string): Promise<unknown> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			cf: { cacheTtl: 300, cacheEverything: true },
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch data: ${response.status} ${response.statusText}`,
			);
		}

		return response.json();
	} catch (error) {
		if ((error as Error)?.name === "AbortError") {
			throw new Error("Fetching conference data timed out");
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
};

const inputValidator = (data: unknown): { year: number } => {
	if (
		typeof data === "object" &&
		data !== null &&
		"year" in data &&
		typeof data.year === "number"
	) {
		return { year: data.year };
	}
	throw new Error("Invalid input; expected { year: number }");
};

export const getCoreData = createServerFn({
	method: "GET",
})
	.inputValidator(inputValidator)
	.handler(async (ctx: { data: { year: number } }) => {
		const year = ctx.data.year;

		if (year >= SPLIT_FILES_YEAR) {
			const data = await fetchJsonWithTimeout(
				`https://r2.fosdempwa.com/fosdem-${year}-core.json`
			);
			return data as Pick<Conference, "conference" | "days" | "types" | "buildings">;
		}

		const fullData = await getFullData(year);
		return {
			conference: fullData.conference,
			days: fullData.days,
			types: fullData.types,
			buildings: fullData.buildings,
		};
	});

export const getTracksData = createServerFn({
	method: "GET",
})
	.inputValidator(inputValidator)
	.handler(async (ctx: { data: { year: number } }) => {
		const year = ctx.data.year;

		if (year >= SPLIT_FILES_YEAR) {
			const data = await fetchJsonWithTimeout(
				`https://r2.fosdempwa.com/fosdem-${year}-tracks.json`
			);
			return data as Pick<Conference, "tracks" | "rooms">;
		}

		const fullData = await getFullData(year);
		return {
			tracks: fullData.tracks,
			rooms: fullData.rooms,
		};
	});

export const getEventsData = createServerFn({
	method: "GET",
})
	.inputValidator(inputValidator)
	.handler(async (ctx: { data: { year: number } }) => {
		const year = ctx.data.year;

		if (year >= SPLIT_FILES_YEAR) {
			const data = await fetchJsonWithTimeout(
				`https://r2.fosdempwa.com/fosdem-${year}-events.json`
			);
			return data as Pick<Conference, "events">;
		}

		const fullData = await getFullData(year);
		return {
			events: fullData.events,
		};
	});

export const getPersonsData = createServerFn({
	method: "GET",
})
	.inputValidator(inputValidator)
	.handler(async (ctx: { data: { year: number } }) => {
		const year = ctx.data.year;

		if (year >= SPLIT_FILES_YEAR) {
			const data = await fetchJsonWithTimeout(
				`https://r2.fosdempwa.com/fosdem-${year}-persons.json`
			).catch(() => ({}));
			return data as Pick<Conference, "persons">;
		}

		const fullData = await getFullData(year);
		return {
			persons: fullData.persons,
		};
	});
