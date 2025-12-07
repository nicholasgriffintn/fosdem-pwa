import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	primaryKey,
	text,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
	"user",
	{
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
		is_guest: integer({ mode: "boolean" }).default(false),
	},
	(table) => {
		return {
			emailIdx: uniqueIndex("email_idx").on(table.email),
			githubUsernameIdx: uniqueIndex("github_username_idx").on(
				table.github_username,
			),
			twitterUsernameIdx: uniqueIndex("twitter_username_idx").on(
				table.twitter_username,
			),
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

export const session = sqliteTable(
	"session",
	{
		id: text().primaryKey(),
		user_id: integer()
			.notNull()
			.references(() => user.id),
		expires_at: text().notNull(),
		last_extended_at: text("last_extended_at")
			.default(sql`(CURRENT_TIMESTAMP)`)
			.notNull(),
	},
	(table) => {
		return {
			expiresAtIdx: index("expires_at_idx").on(table.expires_at),
			userIdIdx: index("session_user_id_idx").on(table.user_id),
		};
	},
);

export type Session = typeof session.$inferSelect;

export const bookmark = sqliteTable(
	"bookmark",
	{
		id: text().primaryKey(),
		slug: text().notNull(),
		user_id: integer()
			.notNull()
			.references(() => user.id),
		type: text().notNull(),
		status: text().notNull(),
		year: integer().notNull(),
		priority: integer(),
		last_notification_sent_at: text(),
		created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updated_at: text()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => {
		return {
			yearIdx: index("year_idx").on(table.year),
			typeIdx: index("type_idx").on(table.type),
			slugIdx: index("slug_idx").on(table.slug),
		};
	},
);

export type Bookmark = typeof bookmark.$inferSelect;

export const note = sqliteTable(
	"note",
	{
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
	},
	(table) => {
		return {
			yearIdx: index("note_year_idx").on(table.year),
			slugIdx: index("note_slug_idx").on(table.slug),
		};
	},
);

export type Note = typeof note.$inferSelect;

export const subscription = sqliteTable(
	"subscription",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		user_id: integer()
			.notNull()
			.references(() => user.id),
		endpoint: text().notNull(),
		auth: text().notNull(),
		p256dh: text().notNull(),
		created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updated_at: text()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => {
		return {
			userIdIdx: index("subscription_user_id_idx").on(table.user_id),
		};
	},
);

export type Subscription = typeof subscription.$inferSelect;

export const scheduleSnapshot = sqliteTable(
	"schedule_snapshot",
	{
		slug: text().notNull(),
		start_time: text(),
		duration: text(),
		room: text(),
		year: integer().notNull(),
		updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	},
	(table) => {
		return {
			scheduleSnapshotPk: primaryKey({
				columns: [table.slug, table.year],
			}),
			scheduleSnapshotYearIdx: index("schedule_snapshot_year_idx").on(table.year),
		};
	},
);

export type ScheduleSnapshot = typeof scheduleSnapshot.$inferSelect;
