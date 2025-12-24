export const CacheKeys = {
  session: (id: string) => `session:${id}`,
  user: (id: number) => `user:${id}`,
  fosdemData: (year: number) => `fosdem:${year}`,
} as const;
