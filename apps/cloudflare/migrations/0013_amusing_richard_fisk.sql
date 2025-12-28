CREATE TABLE `schedule_snapshot` (
	`slug` text NOT NULL,
	`start_time` text,
	`duration` text,
	`room` text,
	`year` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`slug`, `year`)
);
--> statement-breakpoint
CREATE INDEX `schedule_snapshot_year_idx` ON `schedule_snapshot` (`year`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookmark` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`year` integer NOT NULL,
	`priority` integer,
	`last_notification_sent_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bookmark`("id", "slug", "user_id", "type", "status", "year", "priority", "last_notification_sent_at", "created_at", "updated_at") SELECT "id", "slug", "user_id", "type", "status", "year", "priority", "last_notification_sent_at", "created_at", "updated_at" FROM `bookmark`;--> statement-breakpoint
DROP TABLE `bookmark`;--> statement-breakpoint
ALTER TABLE `__new_bookmark` RENAME TO `bookmark`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `year_idx` ON `bookmark` (`year`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `bookmark` (`type`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `bookmark` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_note` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`note` text NOT NULL,
	`time` integer,
	`year` integer NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_note`("id", "user_id", "note", "time", "year", "slug", "created_at", "updated_at") SELECT "id", "user_id", "note", "time", "year", "slug", "created_at", "updated_at" FROM `note`;--> statement-breakpoint
DROP TABLE `note`;--> statement-breakpoint
ALTER TABLE `__new_note` RENAME TO `note`;--> statement-breakpoint
CREATE INDEX `note_year_idx` ON `note` (`year`);--> statement-breakpoint
CREATE INDEX `note_slug_idx` ON `note` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_oauth_account` (
	`provider_id` text,
	`provider_user_id` text,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`provider_id`, `provider_user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_oauth_account`("provider_id", "provider_user_id", "user_id") SELECT "provider_id", "provider_user_id", "user_id" FROM `oauth_account`;--> statement-breakpoint
DROP TABLE `oauth_account`;--> statement-breakpoint
ALTER TABLE `__new_oauth_account` RENAME TO `oauth_account`;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	`last_extended_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "user_id", "expires_at", "last_extended_at") SELECT "id", "user_id", "expires_at", "last_extended_at" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`auth` text NOT NULL,
	`p256dh` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_subscription`("id", "user_id", "endpoint", "auth", "p256dh", "created_at", "updated_at") SELECT "id", "user_id", "endpoint", "auth", "p256dh", "created_at", "updated_at" FROM `subscription`;--> statement-breakpoint
DROP TABLE `subscription`;--> statement-breakpoint
ALTER TABLE `__new_subscription` RENAME TO `subscription`;--> statement-breakpoint
CREATE INDEX `subscription_user_id_idx` ON `subscription` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_user_endpoint_idx` ON `subscription` (`user_id`,`endpoint`);--> statement-breakpoint
ALTER TABLE `user` ADD `discord_username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `discord_username_idx` ON `user` (`discord_username`);