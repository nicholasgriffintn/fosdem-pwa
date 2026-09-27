import { conferenceConfig } from "@roomisfull/conference";
import { getEventDateTime, parseEventDuration } from "~/lib/dateTime";
import type { ConferenceData, Event } from "~/types/conference";
import { serialiseJsonForHtml } from "./json";

export function getEventMetadataJson(
	event: Event,
	conference: ConferenceData,
	year: number,
): string {
	const start = getEventDateTime(event, conference);
	const end = start
		? new Date(start.getTime() + parseEventDuration(event.duration))
		: undefined;
	return serialiseJsonForHtml({
		"@context": "https://schema.org",
		"@type": "Event",
		name: event.title,
		description: event.description || event.abstract || "",
		startDate: start?.toISOString(),
		endDate: end?.toISOString(),
		location: { "@type": "Place", name: event.room },
		organizer: {
			"@type": "Organization",
			name: conferenceConfig.name,
			url: conferenceConfig.website,
		},
		url: `${conferenceConfig.appUrl}/event/${encodeURIComponent(event.id)}?year=${year}`,
		attendee: event.persons?.map((name) => ({ "@type": "Person", name })),
	});
}
