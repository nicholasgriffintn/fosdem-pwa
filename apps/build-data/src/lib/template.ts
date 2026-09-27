import type { ConferenceConfig } from "@roomisfull/conference/types";
import type { BuildDataResult } from "../types";
import { dateTimeInZone } from "@roomisfull/conference/utils/date";

export function createConferenceTemplate(
	config: ConferenceConfig,
	year: string,
): BuildDataResult {
	const dates = config.editions[year]?.dates;
	if (!dates?.length)
		throw new Error(`No conference dates configured for ${year}`);
	return {
		conference: {
			acronym: `${config.id}-${year}`,
			title: `${config.name} ${year}`,
			venue: config.venue,
			city: config.city,
			start: dates[0],
			end: dates[dates.length - 1],
			days: dates,
			day_change: "00:00:00",
			timeslot_duration: "00:05:00",
			base_url: config.website,
			time_zone_name: config.timeZone,
		},
		types: {},
		buildings: {},
		rooms: {},
		tracks: {},
		events: {},
		persons: {},
		days: Object.fromEntries(
			dates.map((date, index) => [
				String(index + 1),
				{
					date,
					start: dateTimeInZone(date, "00:00:00", config.timeZone),
					end: dateTimeInZone(date, "23:59:59", config.timeZone),
					id: index + 1,
					name: `Day ${index + 1}`,
					eventCount: 0,
					trackCount: 0,
					roomCount: 0,
					buildingCount: 0,
					rooms: [],
					buildings: [],
					tracks: [],
				},
			]),
		),
	};
}
