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
		discord_username: text(),
		mastodon_username: text(),
		mastodon_acct: text(),
		mastodon_url: text(),
		gitlab_username: text(),
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
			discordUsernameIdx: uniqueIndex("discord_username_idx").on(
				table.discord_username,
			),
			twitterUsernameIdx: uniqueIndex("twitter_username_idx").on(
				table.twitter_username,
			),
			gitlabUsernameIdx: uniqueIndex("gitlab_username_idx").on(
				table.gitlab_username,
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
			.references(() => user.id, { onDelete: "cascade" }),
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
			.references(() => user.id, { onDelete: "cascade" }),
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
			.references(() => user.id, { onDelete: "cascade" }),
		type: text().notNull(),
		status: text().notNull(),
		year: integer().notNull(),
		priority: integer(),
		last_notification_sent_at: text(),
		watch_later: integer({ mode: "boolean" }).default(false),
		watch_status: text().default("unwatched"), // "unwatched" | "watching" | "watched"
		watch_progress_seconds: integer().default(0),
		playback_speed: text().default("1"),
		last_watched_at: text(),
		attended: integer({ mode: "boolean" }).default(false),
		attended_at: text(),
		attended_in_person: integer({ mode: "boolean" }).default(false),
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
			statusIdx: index("status_idx").on(table.status),
			userYearStatusIdx: index("bookmark_user_year_status_idx").on(
				table.user_id,
				table.year,
				table.status,
			),
			userYearSlugIdx: index("bookmark_user_year_slug_idx").on(
				table.user_id,
				table.year,
				table.slug,
			),
			watchLaterIdx: index("watch_later_idx").on(table.watch_later),
			watchStatusIdx: index("watch_status_idx").on(table.watch_status),
			userYearWatchLaterIdx: index("bookmark_user_year_watch_later_idx").on(
				table.user_id,
				table.year,
				table.watch_later,
			),
			userYearWatchStatusIdx: index("bookmark_user_year_watch_status_idx").on(
				table.user_id,
				table.year,
				table.watch_status,
			),
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
			.references(() => user.id, { onDelete: "cascade" }),
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
			userYearSlugIdx: index("note_user_year_slug_idx").on(
				table.user_id,
				table.year,
				table.slug,
			),
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
			.references(() => user.id, { onDelete: "cascade" }),
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
			subscriptionUserEndpointIdx: uniqueIndex(
				"subscription_user_endpoint_idx",
			).on(table.user_id, table.endpoint),
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
			scheduleSnapshotYearIdx: index("schedule_snapshot_year_idx").on(
				table.year,
			),
		};
	},
);

export type ScheduleSnapshot = typeof scheduleSnapshot.$inferSelect;

export const notificationPreference = sqliteTable(
	"notification_preference",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		user_id: integer()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		reminder_minutes_before: integer().default(15), // 5, 10, 15, 30
		event_reminders: integer({ mode: "boolean" }).default(true),
		schedule_changes: integer({ mode: "boolean" }).default(true),
		room_status_alerts: integer({ mode: "boolean" }).default(true),
		recording_available: integer({ mode: "boolean" }).default(false),
		daily_summary: integer({ mode: "boolean" }).default(true),
		notify_low_priority: integer({ mode: "boolean" }).default(false),
		created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updated_at: text()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => {
		return {
			userIdIdx: uniqueIndex("notification_preference_user_id_idx").on(
				table.user_id,
			),
		};
	},
);

export type NotificationPreference = typeof notificationPreference.$inferSelect;

export const roomStatusHistory = sqliteTable(
	"room_status_history",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		room_name: text().notNull(),
		state: text().notNull(), // "1" = full, "0" = available
		year: integer().notNull(),
		recorded_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	},
	(table) => {
		return {
			roomYearIdx: index("room_status_room_year_idx").on(
				table.room_name,
				table.year,
			),
			recordedAtIdx: index("room_status_recorded_at_idx").on(table.recorded_at),
		};
	},
);

export type RoomStatusHistory = typeof roomStatusHistory.$inferSelect;

export const userConferenceStats = sqliteTable(
	"user_conference_stats",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		user_id: integer()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		year: integer().notNull(),
		events_bookmarked: integer().default(0),
		events_attended: integer().default(0),
		events_attended_in_person: integer().default(0),
		events_watched: integer().default(0),
		tracks_covered: integer().default(0),
		notes_taken: integer().default(0),
		total_watch_time_seconds: integer().default(0),
		created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updated_at: text()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => {
		return {
			userYearIdx: uniqueIndex("user_conference_stats_user_year_idx").on(
				table.user_id,
				table.year,
			),
		};
	},
);

export type UserConferenceStats = typeof userConferenceStats.$inferSelect;

export const recordingSnapshot = sqliteTable(
	"recording_snapshot",
	{
		slug: text().notNull(),
		year: integer().notNull(),
		has_recording: integer({ mode: "boolean" }).default(false),
		recording_url: text(),
		notified_at: text(),
		updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	},
	(table) => {
		return {
			recordingSnapshotPk: primaryKey({
				columns: [table.slug, table.year],
			}),
			recordingSnapshotYearIdx: index("recording_snapshot_year_idx").on(
				table.year,
			),
		};
	},
);

export type RecordingSnapshot = typeof recordingSnapshot.$inferSelect;
