import type { Event, ConferenceData } from "~/types/fosdem";
import { constants } from "~/constants";

export function formatTime(seconds?: number) {
	if (!seconds) return null;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function createStandardDate(date: Date | string | number) {
	return new Date(
		new Date(date).toLocaleString("en-US", { timeZone: constants.TIME_ZONE }),
	);
}

export function formatDate(date: Date | string | number) {
	return createStandardDate(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: constants.TIME_ZONE,
	});
}

export function get24HrFormat(str: string) {
	const _t = str.split(/[^0-9]/g);
	_t[0] = String(+_t[0] + (str.indexOf("pm") > -1 && +_t[0] !== 12 ? 12 : 0));
	return _t.join("");
}

export function calculateEndTime(startTime: string, duration: string) {
	const [startHours, startMinutes] = startTime.split(":").map(Number);
	const [durationHours, durationMinutes] = duration.split(":").map(Number);

	const totalMinutes =
		startHours * 60 + startMinutes + (durationHours * 60 + durationMinutes);
	const endHours = Math.floor(totalMinutes / 60);
	const endMinutes = totalMinutes % 60;

	return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

export function parseEventDuration(durationStr: string) {
	const [hours, minutes] = durationStr.split(":").map(Number);
	return (hours * 60 + minutes) * 60 * 1000;
}

export function getEventDateTime(
	event: Event,
	conference: ConferenceData,
): Date | null {
	if (
		!conference?.days ||
		!Array.isArray(conference.days) ||
		conference.days.length === 0 ||
		!event.day
	) {
		return null;
	}

	const dayIndex = Number(event.day) - 1;
	if (dayIndex < 0 || dayIndex >= conference.days.length) {
		return null;
	}

	if (!conference.days[dayIndex]) {
		return null;
	}

	const eventDate = createStandardDate(conference.days[dayIndex]);
	const [hours, minutes] = event.startTime.split(":").map(Number);
	eventDate.setHours(hours, minutes, 0, 0);
	return eventDate;
}

export function isEventLive(
	event: Event,
	conference: ConferenceData,
	referenceTime?: Date,
): boolean {
	try {
		const now = referenceTime
			? createStandardDate(referenceTime)
			: createStandardDate(new Date());
		const eventStart = getEventDateTime(event, conference);
		if (!eventStart) return false;

		const duration = parseEventDuration(event.duration);
		const eventEnd = new Date(eventStart.getTime() + duration);

		return now >= eventStart && now <= eventEnd;
	} catch (error) {
		console.error("Error checking if event is live:", error);
		return false;
	}
}

export function isEventUpcoming(
	event: Event,
	conference: ConferenceData,
	withinMinutes = 30,
	referenceTime?: Date,
): boolean {
	try {
		const now = referenceTime
			? createStandardDate(referenceTime)
			: createStandardDate(new Date());
		const eventStart = getEventDateTime(event, conference);
		if (!eventStart) return false;

		const timeUntilStart = eventStart.getTime() - now.getTime();
		return timeUntilStart > 0 && timeUntilStart <= withinMinutes * 60 * 1000;
	} catch (error) {
		console.error("Error checking if event is upcoming:", error);
		return false;
	}
}

export function isEventFinished(
	event: Event,
	conference: ConferenceData,
	referenceTime?: Date,
): boolean {
	try {
		const now = referenceTime
			? createStandardDate(referenceTime)
			: createStandardDate(new Date());
		const eventStart = getEventDateTime(event, conference);
		if (!eventStart) return false;

		const duration = parseEventDuration(event.duration);
		const eventEnd = new Date(eventStart.getTime() + duration);

		return now > eventEnd;
	} catch (error) {
		console.error("Error checking if event is finished:", error);
		return false;
	}
}

export function calculateTransitionTime(event1: Event, event2: Event) {
	const [hours1, minutes1] = calculateEndTime(event1.startTime, event1.duration)
		.split(":")
		.map(Number);
	const [hours2, minutes2] = event2.startTime.split(":").map(Number);

	const totalMinutes1 = hours1 * 60 + minutes1;
	const totalMinutes2 = hours2 * 60 + minutes2;

	return totalMinutes2 - totalMinutes1;
}

export function isConferenceMoreThanOneMonthAway(
	conference: ConferenceData,
	referenceDate?: Date,
): boolean {
	try {
		const now = referenceDate
			? createStandardDate(referenceDate)
			: createStandardDate(new Date());
		const conferenceStart = createStandardDate(conference.start);

		// Calculate the difference in months
		const diffTime = conferenceStart.getTime() - now.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);
		const diffMonths = diffDays / 30.44; // Average days in a month

		return diffMonths > 1;
	} catch (error) {
		console.error("Error checking if conference is more than 1 month away:", error);
		return false;
	}
}
