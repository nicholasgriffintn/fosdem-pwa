export function formatISODate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function dateTimeInZone(
	date: string,
	time: string,
	timeZone: string,
): string {
	const wallTime = Date.parse(`${date}T${time}Z`);
	const formatter = new Intl.DateTimeFormat("en", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});
	let instant = wallTime;
	for (let attempt = 0; attempt < 3; attempt++) {
		const parts = Object.fromEntries(
			formatter.formatToParts(instant).map((part) => [part.type, part.value]),
		);
		const represented = Date.UTC(
			Number(parts.year),
			Number(parts.month) - 1,
			Number(parts.day),
			Number(parts.hour),
			Number(parts.minute),
			Number(parts.second),
		);
		const adjustment = wallTime - represented;
		if (adjustment === 0) return new Date(instant).toISOString();
		instant += adjustment;
	}
	throw new Error(`Invalid local conference time: ${date} ${time} ${timeZone}`);
}
