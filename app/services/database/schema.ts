import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey().notNull(),
    name: text('name'),
    email: text('email'),
    type: text('type').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (users) => ({
    emailIdx: uniqueIndex('emailIdx').on(users.email),
  })
);

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    id: integer('id').primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    type: text('type').notNull(),
    slug: text('slug').notNull(),
    status: text('status').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (bookmarks) => ({
    userArticleIdx: uniqueIndex('userArticleIdx').on(
      bookmarks.userId,
      bookmarks.slug
    ),
  })
);
