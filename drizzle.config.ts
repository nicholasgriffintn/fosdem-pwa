import type { Config } from 'drizzle-kit';

export default {
  driver: 'd1',
  schema: './app/services/database/schema.ts',
  out: './migrations',
} satisfies Config;
