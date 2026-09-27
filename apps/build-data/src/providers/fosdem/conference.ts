import type { Conference } from "../../types";

export function flattenConference(conference: any): Conference {
	const result: Conference = {
		acronym: conference.acronym?._text,
		title: conference.title?._text,
		subtitle: conference.subtitle?._text,
		venue: conference.venue?._text,
		city: conference.city?._text,
		start: conference.start?._text,
		end: conference.end?._text,
		days: [conference.start?._text, conference.end?._text].filter(Boolean),
		day_change: conference.day_change?._text,
		timeslot_duration: conference.timeslot_duration?._text,
		base_url: conference.base_url?._text,
		time_zone_name: conference.time_zone_name?._text,
	};

	return result;
}
