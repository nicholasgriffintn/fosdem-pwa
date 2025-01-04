import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	primaryKey,
	text,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text(),
	avatar_url: text(),
	email: text().unique().notNull(),
	github_username: text(),
	company: text(),
	site: text(),
	location: text(),
	bio: text(),
	twitter_username: text(),
	created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated_at: text()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	setup_at: text(),
	terms_accepted_at: text(),
	bookmarks_visibility: text().default("private"),
},
	(table) => {
		return {
			emailIdx: uniqueIndex("email_idx").on(table.email),
			githubUsernameIdx: uniqueIndex("github_username_idx").on(table.github_username),
			twitterUsernameIdx: uniqueIndex("twitter_username_idx").on(table.twitter_username),
		};
	},
);

export type User = typeof user.$inferSelect;

export const oauthAccount = sqliteTable(
	"oauth_account",
	{
		provider_id: text(),
		provider_user_id: text(),
		user_id: integer()
			.notNull()
			.references(() => user.id),
	},
	(table) => [
		primaryKey({ columns: [table.provider_id, table.provider_user_id] }),
	],
);

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	user_id: integer()
		.notNull()
		.references(() => user.id),
	expires_at: text().notNull(),
	last_extended_at: text("last_extended_at").default(sql`(CURRENT_TIMESTAMP)`).notNull()
}, (table) => {
	return {
		expiresAtIdx: index("expires_at_idx").on(table.expires_at),
	};
});

export type Session = typeof session.$inferSelect;

export const bookmark = sqliteTable("bookmark", {
	id: text().primaryKey(),
	slug: text().notNull(),
	user_id: integer()
		.notNull()
		.references(() => user.id),
	type: text().notNull(),
	status: text().notNull(),
	year: integer().notNull(),
	created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated_at: text()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => {
	return {
		yearIdx: index("year_idx").on(table.year),
		typeIdx: index("type_idx").on(table.type),
		slugIdx: uniqueIndex("slug_idx").on(table.slug),
	};
});

export type Bookmark = typeof bookmark.$inferSelect;

export const note = sqliteTable("note", {
	id: integer().primaryKey({ autoIncrement: true }),
	user_id: integer()
		.notNull()
		.references(() => user.id),
	note: text().notNull(),
	time: integer(),
	year: integer().notNull(),
	slug: text().notNull(),
	created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated_at: text()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => {
	return {
		yearIdx: index("note_year_idx").on(table.year),
		slugIdx: index("note_slug_idx").on(table.slug),
	};
});

export type Note = typeof note.$inferSelect;