import type { DayGroupedData } from "~/types/fosdem";

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
