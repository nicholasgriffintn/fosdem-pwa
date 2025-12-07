import type { Config } from 'drizzle-kit';

export default {
  dialect: "sqlite",
  driver: "d1-http",
  schema: './src/server/db/schema.ts',
  out: './migrations',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
    token: process.env.CLOUDFLARE_D1_TOKEN || "",
  },
} satisfies Config;
