import { sql } from 'drizzle-orm';
import { integer, sqliteTable, primaryKey, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer().primaryKey().notNull(),
  name: text(),
  avatar_url: text(),
  email: text().unique().notNull(),
  created_at: integer()
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: integer()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date().getTime()),
  setup_at: integer(),
  terms_accepted_at: integer(),
});

export const oauthAccount = sqliteTable(
  "oauth_account",
  {
    provider_id: text(),
    provider_user_id: text(),
    user_id: integer()
      .notNull()
      .references(() => user.id),
  },
  (table: any) => [primaryKey({ columns: [table.provider_id, table.provider_user_id] })],
);

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  user_id: integer()
    .notNull()
    .references(() => user.id),
  expires_at: integer().notNull(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;