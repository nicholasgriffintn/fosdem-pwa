import { conferenceConfig } from "@roomisfull/conference";
type ConferenceParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

function getConferenceParts(date: Date): ConferenceParts {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: conferenceConfig.timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});

	const parts = formatter.formatToParts(date);
	const values: Record<string, number> = {};
	for (const part of parts) {
		if (part.type !== "literal") {
			values[part.type] = Number(part.value);
		}
	}

	return {
		year: values.year,
		month: values.month,
		day: values.day,
		hour: values.hour,
		minute: values.minute,
		second: values.second,
	};
}

export function createConferenceDate(date?: Date | string | number) {
	const inputDate = date ? new Date(date) : new Date();
	const { year, month, day, hour, minute, second } =
		getConferenceParts(inputDate);
	return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

export function getCurrentDate(): string {
	const { year, month, day } = getConferenceParts(new Date());
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}
