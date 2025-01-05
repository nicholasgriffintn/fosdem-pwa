import type { DayGroupedData } from "~/types/fosdem";
import type { Event, ConferenceData } from "~/types/fosdem";
import { getEventDateTime, parseEventDuration } from "./eventTiming";

interface TimeSlot {
	time: string;
	events: Event[];
}

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

export function generateTimeSlots(events: Event[]): TimeSlot[] {
	const timeSlots: { [key: string]: Event[] } = {};
	const sortedTimes: string[] = [];

	for (const event of events) {
		if (!timeSlots[event.startTime]) {
			timeSlots[event.startTime] = [];
			sortedTimes.push(event.startTime);
		}
		timeSlots[event.startTime].push(event);
	}

	sortedTimes.sort((a, b) => {
		const [aHours, aMinutes] = a.split(":").map(Number);
		const [bHours, bMinutes] = b.split(":").map(Number);
		return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
	});

	return sortedTimes.map(time => ({
		time,
		events: timeSlots[time]
	}));
}