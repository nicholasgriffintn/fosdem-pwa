export const CacheKeys = {
  session: (id: string) => `session:${id}`,
  fosdemData: (year: number) => `conference:${year}`,
} as const;
