import type { Config } from 'drizzle-kit';

export default {
  // @ts-ignore
  driver: 'd1',
  schema: './app/server/db/schema.ts',
  out: './drizzle',
} satisfies Config;
