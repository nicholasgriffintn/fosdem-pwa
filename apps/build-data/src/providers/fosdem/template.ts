import type { BuildDataResult } from "../../types";
import { formatISODate } from "@roomisfull/conference/utils/date";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const getConferenceDates = (year: string) => {
	const firstOfFebruary = new Date(Date.UTC(Number(year), 1, 1));
	const daysUntilSaturday = 6 - firstOfFebruary.getUTCDay();
	const daysToClosestSaturday =
		daysUntilSaturday > 3 ? daysUntilSaturday - 7 : daysUntilSaturday;
	const firstDay = new Date(
		firstOfFebruary.getTime() + daysToClosestSaturday * DAY_IN_MILLISECONDS,
	);
	const secondDay = new Date(firstDay.getTime() + DAY_IN_MILLISECONDS);
	const dayAfterConference = new Date(
		secondDay.getTime() + DAY_IN_MILLISECONDS,
	);

	return {
		firstDay: formatISODate(firstDay),
		secondDay: formatISODate(secondDay),
		dayAfterConference: formatISODate(dayAfterConference),
	};
};

export const createFosdemTemplate = (year: string): BuildDataResult => {
	const { firstDay, secondDay, dayAfterConference } = getConferenceDates(year);

	return {
		conference: {
			acronym: `fosdem-${year}`,
			title: `FOSDEM ${year}`,
			subtitle: "",
			venue: "ULB (Université Libre de Bruxelles)",
			city: "Brussels",
			start: firstDay,
			end: secondDay,
			days: [firstDay, secondDay],
			day_change: "09:00:00",
			timeslot_duration: "00:05:00",
			base_url: `https://fosdem.org/${year}/schedule/`,
			time_zone_name: "Europe/Brussels",
		},
		types: {},
		buildings: {},
		days: {
			"1": {
				date: firstDay,
				start: `${firstDay}T09:00:00+01:00`,
				end: `${secondDay}T08:59:00+01:00`,
				id: 1,
				name: "Day 1",
				eventCount: 0,
				trackCount: 0,
				roomCount: 0,
				buildingCount: 0,
				rooms: [],
				buildings: [],
				tracks: [],
			},
			"2": {
				date: secondDay,
				start: `${secondDay}T09:00:00+01:00`,
				end: `${dayAfterConference}T08:59:00+01:00`,
				id: 2,
				name: "Day 2",
				eventCount: 0,
				trackCount: 0,
				roomCount: 0,
				buildingCount: 0,
				rooms: [],
				buildings: [],
				tracks: [],
			},
		},
		rooms: {},
		tracks: {},
		events: {},
	};
};
