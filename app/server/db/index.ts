import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from "./schema";
export interface Env {
  DB: D1Database;
}

export function getDbFromContext(context: { env: Env }) {
  const ENV = context.env as Env;
  return drizzle(ENV.DB, { schema: schema });
}

export { schema }