export const CacheKeys = {
  session: (id: string) => `session:${id}`,
} as const;
