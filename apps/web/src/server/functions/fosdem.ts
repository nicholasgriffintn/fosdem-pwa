import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import type { Conference } from "~/types/fosdem";

const FETCH_TIMEOUT_MS = 8000;

/**
 * Fetches and validates conference data for a given year
 */
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

export const getAllData = createServerFn({
	method: "GET",
})
	.inputValidator((data: unknown) => {
		if (
			typeof data === "object" &&
			data !== null &&
			"year" in data &&
			typeof (data as any).year === "number"
		) {
			return { year: (data as any).year };
		}
		throw new Error("Invalid input; expected { year: number }");
	})
	.handler(async (ctx: any) => {
		const data = await getFullData(ctx.data.year);
		return data;
	});
