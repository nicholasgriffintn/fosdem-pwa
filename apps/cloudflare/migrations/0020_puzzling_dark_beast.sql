CREATE TABLE `room_status_latest` (
	`room_name` text NOT NULL,
	`year` integer NOT NULL,
	`state` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `room_status_latest_year_idx` ON `room_status_latest` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `room_status_latest_room_year_pk` ON `room_status_latest` (`room_name`,`year`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `bookmark` (`status`);