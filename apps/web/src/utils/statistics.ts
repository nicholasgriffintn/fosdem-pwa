export function formatWatchTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

export function calculateGrowth(
	current: number,
	previous: number,
): { percentage: number; trend: "up" | "down" | "neutral" } {
	if (previous === 0) {
		return {
			percentage: current > 0 ? 100 : 0,
			trend: current > 0 ? "up" : "neutral",
		};
	}
	const percentage = Math.round(((current - previous) / previous) * 100);
	return {
		percentage: Math.abs(percentage),
		trend: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",
	};
}
