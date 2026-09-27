export const CacheKeys = {
	session: (id: string) => `session:${id}`,
	scheduleData: (year: number) => `conference:${year}`,
	roomStatus: () => `room:status`,
} as const;
