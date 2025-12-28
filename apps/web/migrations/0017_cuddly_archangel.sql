CREATE TABLE `notification_preference` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`reminder_minutes_before` integer DEFAULT 15,
	`event_reminders` integer DEFAULT true,
	`schedule_changes` integer DEFAULT true,
	`room_status_alerts` integer DEFAULT true,
	`recording_available` integer DEFAULT false,
	`daily_summary` integer DEFAULT true,
	`notify_low_priority` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preference_user_id_idx` ON `notification_preference` (`user_id`);--> statement-breakpoint
CREATE TABLE `recording_snapshot` (
	`slug` text NOT NULL,
	`year` integer NOT NULL,
	`has_recording` integer DEFAULT false,
	`recording_url` text,
	`notified_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`slug`, `year`)
);
--> statement-breakpoint
CREATE INDEX `recording_snapshot_year_idx` ON `recording_snapshot` (`year`);--> statement-breakpoint
CREATE TABLE `room_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_name` text NOT NULL,
	`state` text NOT NULL,
	`year` integer NOT NULL,
	`recorded_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `room_status_room_year_idx` ON `room_status_history` (`room_name`,`year`);--> statement-breakpoint
CREATE INDEX `room_status_recorded_at_idx` ON `room_status_history` (`recorded_at`);--> statement-breakpoint
CREATE TABLE `user_conference_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`year` integer NOT NULL,
	`events_bookmarked` integer DEFAULT 0,
	`events_attended` integer DEFAULT 0,
	`events_attended_in_person` integer DEFAULT 0,
	`events_watched` integer DEFAULT 0,
	`tracks_covered` integer DEFAULT 0,
	`notes_taken` integer DEFAULT 0,
	`total_watch_time_seconds` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_conference_stats_user_year_idx` ON `user_conference_stats` (`user_id`,`year`);--> statement-breakpoint
ALTER TABLE `bookmark` ADD `watch_later` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `bookmark` ADD `watch_status` text DEFAULT 'unwatched';--> statement-breakpoint
ALTER TABLE `bookmark` ADD `watch_progress_seconds` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookmark` ADD `playback_speed` text DEFAULT '1';--> statement-breakpoint
ALTER TABLE `bookmark` ADD `last_watched_at` text;--> statement-breakpoint
ALTER TABLE `bookmark` ADD `attended` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `bookmark` ADD `attended_at` text;--> statement-breakpoint
ALTER TABLE `bookmark` ADD `attended_in_person` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `watch_later_idx` ON `bookmark` (`watch_later`);--> statement-breakpoint
CREATE INDEX `watch_status_idx` ON `bookmark` (`watch_status`);