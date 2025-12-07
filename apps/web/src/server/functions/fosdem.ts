import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import type { Conference } from "~/types/fosdem";

/**
 * Fetches and validates conference data for a given year
 */
const isValidYear = (year: string) =>
	/^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100;

const getFullData = async (year: string): Promise<Conference> => {
	if (!isValidYear(year)) {
		throw new Error("Invalid year; expected YYYY between 2000-2100");
	}

	const url = constants.DATA_LINK.replace("${YEAR}", year);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);

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
		throw new Error(`Failed to fetch data: ${response.statusText}`);
	}

	const json = (await response.json()) as unknown;

	if (!json || typeof json !== "object" || !("conference" in json)) {
		throw new Error("Invalid conference data format");
	}

	return json as Conference;
};

export const getAllData = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number }) => data)
	.handler(async (ctx: any) => {
		const data = await getFullData(ctx.data.year);
		return data;
	});
