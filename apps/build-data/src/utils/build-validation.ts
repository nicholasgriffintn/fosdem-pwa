import type { BuildDataResult } from "../types";

export const validateBuildData = (data: BuildDataResult) => {
	if (!data || typeof data !== "object") {
		throw new Error("Generated data payload is empty");
	}

	const requiredKeys: Array<keyof BuildDataResult> = [
		"conference",
		"events",
		"tracks",
		"rooms",
		"days",
		"types",
		"buildings",
	];

	for (const key of requiredKeys) {
		if (!(key in data)) {
			throw new Error(`Generated data missing "${key}" section`);
		}
	}

	if (!Object.keys(data.events ?? {}).length) {
		throw new Error("Generated data contains no events");
	}
};
