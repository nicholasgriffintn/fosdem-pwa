type BrusselsParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

function getBrusselsParts(date: Date): BrusselsParts {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Brussels",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
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

export function createBrusselsDate(date?: Date | string | number) {
	const inputDate = date ? new Date(date) : new Date();
	const { year, month, day, hour, minute, second } = getBrusselsParts(inputDate);
	return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

export function getCurrentDate(): string {
	const { year, month, day } = getBrusselsParts(new Date());
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
} 
