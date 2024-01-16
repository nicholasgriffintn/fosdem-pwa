import type { AppLoadContext } from '@remix-run/cloudflare';
import { drizzle } from 'drizzle-orm/d1';

export interface Env {
  DB: D1Database;
}

export function getDbFromContext(context: AppLoadContext) {
  const ENV = context.env as Env;
  return drizzle(ENV.DB);
}
