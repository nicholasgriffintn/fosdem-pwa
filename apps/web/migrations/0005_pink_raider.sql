CREATE TABLE `note` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`note` text NOT NULL,
	`time` integer,
	`year` integer NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `note_year_idx` ON `note` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `note_slug_idx` ON `note` (`slug`);