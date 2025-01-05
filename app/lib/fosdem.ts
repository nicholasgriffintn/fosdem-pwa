import type { DayGroupedData } from "~/types/fosdem";
import type { Event, ConferenceData } from "~/types/fosdem";
import { getEventDateTime, parseEventDuration } from "./eventTiming";

export const groupByDay = (
	items: any[],
	getDayFn: (item: any) => string[],
): DayGroupedData => {
	return items.reduce((acc: DayGroupedData, item) => {
		const dayValue = getDayFn(item);
		const days = Array.isArray(dayValue) ? dayValue : [String(dayValue)];

		// biome-ignore lint/complexity/noForEach: <explanation>
		days.forEach((day) => {
			if (!acc[day]) {
				acc[day] = [];
			}
			acc[day].push(item);
		});

		return acc;
	}, {});
};

export interface EventConflict {
	event1: Event;
	event2: Event;
	overlapDuration: number;
	startOverlap: Date;
	endOverlap: Date;
}

export interface GroupedConflict {
	mainEvent: Event;
	conflicts: {
		event: Event;
		duration: number;
		startOverlap: Date;
		endOverlap: Date;
	}[];
}

export function detectEventConflicts(events: Event[], conference: ConferenceData): EventConflict[] {
	const conflicts: EventConflict[] = [];

	if (events.length < 2) {
		return conflicts;
	}

	for (let i = 0; i < events.length - 1; i++) {
		for (let j = i + 1; j < events.length; j++) {
			const event1 = events[i];
			const event2 = events[j];

			if (event1.day !== event2.day) {
				continue;
			}

			const event1Start = getEventDateTime(event1, conference);
			const event2Start = getEventDateTime(event2, conference);

			if (!event1Start || !event2Start) {
				continue;
			}

			const event1Duration = parseEventDuration(event1.duration);
			const event2Duration = parseEventDuration(event2.duration);

			const event1End = new Date(event1Start.getTime() + event1Duration);
			const event2End = new Date(event2Start.getTime() + event2Duration);

			const overlapStart = new Date(Math.max(event1Start.getTime(), event2Start.getTime()));
			const overlapEnd = new Date(Math.min(event1End.getTime(), event2End.getTime()));

			if (overlapStart < overlapEnd) {
				const overlapDuration = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));

				conflicts.push({
					event1,
					event2,
					overlapDuration,
					startOverlap: overlapStart,
					endOverlap: overlapEnd
				});
			}
		}
	}

	return conflicts;
}

export function groupConflicts(conflicts: EventConflict[]): GroupedConflict[] {
	const groupedMap = new Map<string, GroupedConflict>();

	// biome-ignore lint/complexity/noForEach: <explanation>
	conflicts.forEach(conflict => {
		// Try both events as the main event to find the one with more conflicts
		// biome-ignore lint/complexity/noForEach: <explanation>
		[
			{ main: conflict.event1, other: conflict.event2 },
			{ main: conflict.event2, other: conflict.event1 }
		].forEach(({ main, other }) => {
			if (!groupedMap.has(main.id)) {
				groupedMap.set(main.id, {
					mainEvent: main,
					conflicts: []
				});
			}

			const group = groupedMap.get(main.id);
			if (group) {
				group.conflicts.push({
					event: other,
					duration: conflict.overlapDuration,
					startOverlap: conflict.startOverlap,
					endOverlap: conflict.endOverlap
				});
			}
		});
	});

	// Select the version with the most conflicts for each event
	const seen = new Set<string>();
	const result: GroupedConflict[] = [];

	for (const [eventId, group] of groupedMap) {
		if (seen.has(eventId)) continue;

		// Find all related conflicts
		const relatedIds = new Set(group.conflicts.map(c => c.event.id));
		// biome-ignore lint/complexity/noForEach: <explanation>
		relatedIds.forEach(id => seen.add(id));

		// Only add groups with the most conflicts
		if (group.conflicts.length > 1) {
			result.push(group);
		}
	}

	return result.sort((a, b) => b.conflicts.length - a.conflicts.length);
}

export function formatGroupedConflictMessage(group: GroupedConflict): string {
	const { mainEvent, conflicts } = group;
	const totalMinutes = conflicts.reduce((sum, c) => sum + c.duration, 0);

	return `"${mainEvent.title}" has ${conflicts.length} conflicts totaling ${totalMinutes} minutes`;
}
