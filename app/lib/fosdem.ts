import type { DayGroupedData } from "~/types/fosdem";
import type { Event, ConferenceData } from "~/types/fosdem";
import { getEventDateTime, parseEventDuration } from "./dateTime";

interface TimeSlot {
	time: string;
	events: Event[];
}

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

			const [hours1, minutes1] = event1.startTime.split(':').map(Number);
			const [hours2, minutes2] = event2.startTime.split(':').map(Number);
			const [durationHours1, durationMinutes1] = event1.duration.split(':').map(Number);
			const [durationHours2, durationMinutes2] = event2.duration.split(':').map(Number);

			const start1 = hours1 * 60 + minutes1;
			const start2 = hours2 * 60 + minutes2;
			const duration1 = durationHours1 * 60 + durationMinutes1;
			const duration2 = durationHours2 * 60 + durationMinutes2;

			const end1 = start1 + duration1;
			const end2 = start2 + duration2;

			const overlapStart = Math.max(start1, start2);
			const overlapEnd = Math.min(end1, end2);

			if (overlapStart < overlapEnd) {
				const overlapDuration = overlapEnd - overlapStart;

				const baseDate = new Date(2024, 0, 1);
				const startDate = new Date(baseDate);
				startDate.setHours(Math.floor(overlapStart / 60), overlapStart % 60);
				const endDate = new Date(baseDate);
				endDate.setHours(Math.floor(overlapEnd / 60), overlapEnd % 60);

				conflicts.push({
					event1,
					event2,
					overlapDuration,
					startOverlap: startDate,
					endOverlap: endDate
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