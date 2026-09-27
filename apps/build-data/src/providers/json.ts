import type { ConferenceConfig } from "@roomisfull/conference/types";
import { validateSchedule } from "../utils/validate-schedule";

export async function fetchJsonSchedule(
	config: ConferenceConfig,
	year: string,
) {
	const url = config.schedule.url.replace("${YEAR}", year);
	const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
	if (!response.ok)
		throw new Error(`Failed to fetch schedule: ${response.status}`);
	const data: unknown = await response.json();
	validateSchedule(data);
	if (data.conference.time_zone_name !== config.timeZone)
		throw new Error("Schedule timezone does not match conference config");
	const dates = config.editions[year]?.dates;
	if (!dates || JSON.stringify(data.conference.days) !== JSON.stringify(dates))
		throw new Error("Schedule dates do not match conference config");
	return data;
}
