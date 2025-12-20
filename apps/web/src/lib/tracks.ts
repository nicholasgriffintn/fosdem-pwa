import type { Event, Track } from "~/types/fosdem";

const normalize = (value?: string | number | null) =>
	value?.toString().trim().toLowerCase() ?? "";

export function doesEventMatchTrack(
	event: Pick<Event, "trackKey">,
	track: Pick<Track, "id" | "name">,
): boolean {
	const eventKey = normalize(event.trackKey);
	if (!eventKey) {
		return false;
	}

	const candidateKeys = [track.id, track.name]
		.filter(Boolean)
		.map((key) => normalize(key));

	return candidateKeys.includes(eventKey);
}
