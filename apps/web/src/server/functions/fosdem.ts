import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import type { Conference } from "~/types/fosdem";
import { isValidYear, isNumber } from "~/lib/type-guards";

const FETCH_TIMEOUT_MS = 8000;
const CURRENT_YEAR_TTL = 60 * 5; // 5 minutes
const PAST_YEAR_TTL = 60 * 60 * 24; // 1 day

const getCacheTTL = (year: number): number => {
	return year === constants.DEFAULT_YEAR ? CURRENT_YEAR_TTL : PAST_YEAR_TTL;
};

const getFullData = async (year: number): Promise<Conference> => {
	if (!isValidYear(year)) {
		throw new Error("Invalid year; expected YYYY between 2000-2100");
	}

	const url = constants.DATA_LINK.replace("${YEAR}", year.toString());

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	let response: Response;

	try {
		const cacheTtl = getCacheTTL(year);
		response = await fetch(url, {
			signal: controller.signal,
			cf: { cacheTtl, cacheEverything: true },
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

	const data = json as Conference;
	return data;
};

export const getAllData = createServerFn({
	method: "GET",
})
	.inputValidator((data: unknown): { year: number } => {
		if (
			typeof data === "object" &&
			data !== null &&
			"year" in data &&
			isNumber(data.year)
		) {
			return { year: data.year };
		}
		throw new Error("Invalid input; expected { year: number }");
	})
	.handler(async (ctx: { data: { year: number } }) => {
		const data = await getFullData(ctx.data.year);
		return data;
	});
