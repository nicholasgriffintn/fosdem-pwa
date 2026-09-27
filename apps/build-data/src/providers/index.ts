import { conferenceConfig } from "@roomisfull/conference";
import type { ConferenceConfig } from "@roomisfull/conference/types";
import { fetchJsonSchedule } from "./json";

export async function buildData(
	{ year }: { year: string },
	config: ConferenceConfig = conferenceConfig,
) {
	if (!/^\d{4}$/.test(year))
		throw new Error("Invalid year format. Expected YYYY");
	if (config.schedule.provider === "fosdem" && config.id === "fosdem") {
		const { buildData: buildFosdemData } = await import("./fosdem");
		return buildFosdemData({ year });
	}
	if (config.schedule.provider === "json")
		return fetchJsonSchedule(config, year);
	throw new Error("Unsupported conference schedule provider");
}
