CREATE INDEX `bookmark_user_year_watch_later_idx` ON `bookmark` (`user_id`,`year`,`watch_later`);--> statement-breakpoint
CREATE INDEX `bookmark_user_year_watch_status_idx` ON `bookmark` (`user_id`,`year`,`watch_status`);--> statement-breakpoint
CREATE INDEX `note_user_year_slug_idx` ON `note` (`user_id`,`year`,`slug`);