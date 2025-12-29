export const CacheKeys = {
  session: (id: string) => `session:${id}`,
  fosdemData: (year: number) => `conference:${year}`,
  roomStatus: () => `room:status`,
} as const;
